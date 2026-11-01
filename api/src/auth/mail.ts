import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { config } from "../config.js";
import { CodigoVerificacion, type Proposito } from "../modelos/CodigoVerificacion.js";

const VIGENCIA_MINUTOS = 10;
/** Tope para adivinar el código del mail (no para la contraseña: esa se puede probar sin límite). */
export const MAX_INTENTOS = 5;

const transporte = config.mail.smtpUrl ? nodemailer.createTransport(config.mail.smtpUrl) : null;

const TEXTOS: Record<Proposito, { para: string; log: string }> = {
  registro: { para: "crear tu cuenta en Pinz", log: "registro" },
  recuperar: { para: "cambiar tu contraseña de Pinz", log: "cambio de contraseña" },
};

/* Con HMAC y no un hash pelado: hay sólo un millón de códigos posibles, así que sin el secreto
   el hash guardado no sirve para adivinarlo. */
function hash(email: string, proposito: Proposito, codigo: string) {
  return createHmac("sha256", config.sesionSecreto).update(`${proposito}:${email}:${codigo}`).digest("hex");
}

/**
 * Crea un código de 6 dígitos (reemplazando el anterior del mismo propósito) y lo manda por mail.
 * En el registro guarda la contraseña elegida hasta que se confirme. Sin SMTP, lo muestra en la consola.
 */
export async function mandarCodigo(email: string, proposito: Proposito, contrasenaHash: string | null = null) {
  email = email.toLowerCase();
  const codigo = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await CodigoVerificacion.findOneAndUpdate(
    { email, proposito },
    {
      codigoHash: hash(email, proposito, codigo),
      contrasenaHash,
      intentos: 0,
      venceEn: new Date(Date.now() + VIGENCIA_MINUTOS * 60 * 1000),
    },
    { upsert: true },
  );

  const { para, log } = TEXTOS[proposito];
  if (!transporte) {
    console.info(`[mail sin SMTP] Código de ${log} para ${email}: ${codigo}`);
    return;
  }
  await transporte.sendMail({
    from: config.mail.remitente,
    to: email,
    subject: `${codigo} es tu código para ${para}`,
    text: `Tu código para ${para} es ${codigo}. Vence en ${VIGENCIA_MINUTOS} minutos.\n\nSi no lo pediste, ignorá este mail.`,
    html: `<p>Tu código para ${para} es:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
<p>Vence en ${VIGENCIA_MINUTOS} minutos. Si no lo pediste, ignorá este mail.</p>`,
  });
}

export async function mandarInvitacion(email: string, viaje: { nombre: string; destino: string; codigo: string }, invita: string) {
  const link = `${config.webUrl}/unirse/${viaje.codigo}`;
  if (!transporte) {
    console.info(`[invitación sin SMTP] Enlace para ${email}: ${link}`);
    return;
  }
  await transporte.sendMail({
    from: config.mail.remitente,
    to: email,
    subject: `${invita} te invitó a ${viaje.nombre}`,
    text: `${invita} te invitó a organizar ${viaje.nombre} (${viaje.destino}) en Pinz.\n\nUnite desde este enlace: ${link}`,
    html: `<p>${invita} te invitó a organizar <strong>${viaje.nombre}</strong> (${viaje.destino}) en Pinz.</p><p><a href="${link}">Unirme al viaje</a></p>`,
  });
}

/**
 * El acuse de "Escribinos". El texto es fijo, sin nada de lo que escribió la persona: así nadie puede
 * usar el formulario para mandarle su propio mensaje a un mail ajeno.
 */
export async function mandarConfirmacionConsulta(email: string) {
  if (!transporte) {
    console.info(`[mail sin SMTP] Confirmación de consulta para ${email}`);
    return;
  }
  await transporte.sendMail({
    from: config.mail.remitente,
    to: email,
    subject: "¡Recibimos tu consulta!",
    text: "¡Recibimos tu consulta! Te responderemos a la brevedad.\n\n¡Gracias por usar Pinz!",
    html: `<p style="font-size:20px;font-weight:bold">¡Recibimos tu consulta!</p>
<p>Te responderemos a la brevedad.</p>
<p>¡Gracias por usar Pinz!</p>`,
  });
}

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Avisa al equipo de una consulta nueva. Con "Responder" en el mail se le contesta directo a la persona. */
export async function avisarConsultaAlEquipo(consulta: { email: string; asunto: string; descripcion: string }) {
  if (!transporte) {
    console.info(`[mail sin SMTP] Consulta nueva de ${consulta.email}: ${consulta.asunto}`);
    return;
  }
  // Sin saltos de línea en el asunto: no se pueden colar encabezados.
  const asunto = consulta.asunto.replace(/\s+/g, " ");
  await transporte.sendMail({
    from: config.mail.remitente,
    to: config.mail.equipo,
    replyTo: consulta.email,
    subject: `Consulta nueva: ${asunto}`,
    text: `De: ${consulta.email}\nAsunto: ${asunto}\n\n${consulta.descripcion}`,
    html: `<p><strong>De:</strong> ${escaparHtml(consulta.email)}<br><strong>Asunto:</strong> ${escaparHtml(asunto)}</p>
<p style="white-space:pre-wrap">${escaparHtml(consulta.descripcion)}</p>`,
  });
}

export type ResultadoVerificacion =
  | { ok: true; email: string; contrasenaHash: string | null }
  | { ok: false; motivo: "codigo-vencido" | "sin-intentos" }
  | { ok: false; motivo: "codigo-incorrecto"; intentosRestantes: number };

/** Comprueba el código. Si es correcto o se acabaron los intentos, lo borra: no se puede volver a usar. */
export async function verificarCodigo(email: string, proposito: Proposito, codigo: string): Promise<ResultadoVerificacion> {
  email = email.toLowerCase();
  // Sumar el intento antes de comparar, en una sola operación: dos pedidos en paralelo no pueden saltarse el tope.
  const guardado = await CodigoVerificacion.findOneAndUpdate(
    { email, proposito, venceEn: { $gt: new Date() }, intentos: { $lt: MAX_INTENTOS } },
    { $inc: { intentos: 1 } },
    { new: true },
  );
  if (!guardado) return { ok: false, motivo: "codigo-vencido" };

  const esperado = Buffer.from(guardado.codigoHash, "hex");
  const recibido = Buffer.from(hash(email, proposito, codigo), "hex");
  if (timingSafeEqual(esperado, recibido)) {
    await guardado.deleteOne();
    return { ok: true, email, contrasenaHash: guardado.contrasenaHash ?? null };
  }
  if (guardado.intentos >= MAX_INTENTOS) {
    await guardado.deleteOne();
    return { ok: false, motivo: "sin-intentos" };
  }
  return { ok: false, motivo: "codigo-incorrecto", intentosRestantes: MAX_INTENTOS - guardado.intentos };
}
