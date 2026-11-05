import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { config } from "../config.js";
import { CodigoVerificacion, type Proposito } from "../modelos/CodigoVerificacion.js";

const VIGENCIA_MINUTOS = 10;
/** Tope para adivinar el código del mail (no para la contraseña: esa se puede probar sin límite). */
export const MAX_INTENTOS = 5;

const transporte = config.mail.smtpUrl ? nodemailer.createTransport(config.mail.smtpUrl) : null;

/* Relativas a este archivo y no al directorio de trabajo: funcionan igual en Docker y en producción. */
const ENCABEZADOS = ["cielo", "lavanda", "mar", "rosa", "sol"].map((color) =>
  fileURLToPath(new URL(`../correo/encabezados/encabezado-${color}.png`, import.meta.url)),
);
type EncabezadoFijo = { ruta: string; alt: string };
/* Mails que llevan siempre el mismo encabezado, sin sorteo. */
const ENCABEZADO_CONSULTA: EncabezadoFijo = {
  ruta: fileURLToPath(new URL("../correo/encabezado-consulta.png", import.meta.url)),
  alt: "Pinz",
};
const ENCABEZADO_INVITACION: EncabezadoFijo = {
  ruta: fileURLToPath(new URL("../correo/encabezado-invitacion.png", import.meta.url)),
  alt: "Te invitaron a un viaje",
};
const CID_ENCABEZADO = "pinz-encabezado";

let ultimoEncabezado = -1;

/**
 * Cada mail sale con uno de los encabezados, elegido al azar en cada envío, sin repetir el del mail
 * anterior: con azar puro, dos mails seguidos salían del mismo color una de cada cinco veces.
 */
export function encabezadorandom() {
  const opciones = ENCABEZADOS.map((_, i) => i).filter((i) => i !== ultimoEncabezado);
  ultimoEncabezado = opciones[Math.floor(Math.random() * opciones.length)]!;
  return ENCABEZADOS[ultimoEncabezado]!;
}

/**
 * Envuelve el cuerpo del mail en un diseño de 600px con un encabezado de Pinz arriba. Sólo tablas y
 * estilos en línea, que es lo que respetan los clientes de correo. La imagen va adjunta (cid), no como
 * URL externa ni data: URI, porque Gmail las bloquea. Con `encabezadoFijo` se usa esa imagen (y su alt)
 * en vez de sortear una.
 */
function conEncabezado(cuerpo: string, encabezadoFijo?: EncabezadoFijo) {
  const encabezado = encabezadoFijo?.ruta ?? encabezadorandom();
  const alt = encabezadoFijo?.alt ?? "Pinz";
  const nombre = basename(encabezado);
  console.info(`[mail] Encabezado: ${nombre}`);
  return {
    html: `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6eedf">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6eedf">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fff8ee;border:3px solid #1c1b22;border-radius:16px;border-collapse:separate;overflow:hidden">
<tr><td style="padding:0;line-height:0;font-size:0"><img src="cid:${CID_ENCABEZADO}" width="600" alt="${escaparHtml(alt)}" style="display:block;width:100%;height:auto;border:0"></td></tr>
<tr><td style="padding:24px 28px;color:#1c1b22;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
${cuerpo}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    attachments: [{ filename: nombre, path: encabezado, cid: CID_ENCABEZADO }],
  };
}

export function correoConfigurado() {
  return transporte !== null;
}

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
    ...conEncabezado(`<p>Tu código para ${para} es:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
<p>Vence en ${VIGENCIA_MINUTOS} minutos. Si no lo pediste, ignorá este mail.</p>`),
  });
}

export async function mandarInvitacion(email: string, viaje: { nombre: string; destino: string; codigo: string }, invita: string) {
  const link = `${config.webUrl}/unirse/${viaje.codigo}`;
  if (!transporte) {
    console.info(`[invitación sin SMTP] Enlace para ${email}: ${link}`);
    return;
  }
  // Sin saltos de línea en el asunto: no se pueden colar encabezados.
  const enAsunto = (texto: string) => texto.replace(/\s+/g, " ").trim();
  const linkHtml = escaparHtml(link);
  await transporte.sendMail({
    from: config.mail.remitente,
    to: email,
    subject: `${enAsunto(invita)} te invitó a ${enAsunto(viaje.nombre)}`,
    text: `${invita} te invitó a organizar ${viaje.nombre} (${viaje.destino}) en Pinz.\n\nUnite desde este enlace: ${link}`,
    ...conEncabezado(
      `<p style="margin:0 0 4px;font-size:22px;font-weight:bold;line-height:1.3">${escaparHtml(invita)} te invitó a ${escaparHtml(viaje.nombre)}</p>
<p style="margin:0 0 16px;color:#6b6678">${escaparHtml(viaje.destino)}</p>
<p style="margin:0 0 24px">Unite al viaje en Pinz para votar planes, ver la agenda y dividir los gastos con el grupo.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:separate">
<tr><td align="center" style="background:#ff8a66;border:3px solid #1c1b22;border-radius:12px">
<a href="${linkHtml}" style="display:inline-block;padding:12px 24px;color:#1c1b22;font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px">Unirme al viaje</a>
</td></tr>
</table>
<p style="margin:0;color:#6b6678;font-size:13px">Si el botón no funciona, copiá este enlace:<br><a href="${linkHtml}" style="color:#6b6678;word-break:break-all">${linkHtml}</a></p>`,
      ENCABEZADO_INVITACION,
    ),
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
    ...conEncabezado(`<p style="font-size:20px;font-weight:bold">¡Recibimos tu consulta!</p>
<p>Te responderemos a la brevedad.</p>
<p>¡Gracias por usar Pinz!</p>`),
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
    subject: `📬 Consulta nueva: ${asunto}`,
    text: `De: ${consulta.email}\nAsunto: ${asunto}\n\n${consulta.descripcion}`,
    ...conEncabezado(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">
<tr><td style="padding:0 16px 6px 0;color:#6b6678;vertical-align:top">De</td><td style="padding:0 0 6px">${escaparHtml(consulta.email)}</td></tr>
<tr><td style="padding:0 16px 0 0;color:#6b6678;vertical-align:top">Asunto</td><td style="font-weight:bold">${escaparHtml(asunto)}</td></tr>
</table>
<div style="background:#f6eedf;border-left:4px solid #ff8a66;border-radius:8px;padding:16px 18px;white-space:pre-wrap">${escaparHtml(consulta.descripcion)}</div>
<p style="margin:16px 0 0;color:#6b6678;font-size:13px">Respondé este mail y le llega directo a la persona.</p>`,
      ENCABEZADO_CONSULTA,
    ),
  });
}

/** Responde una consulta desde el panel usando la cuenta de correo configurada para Pinz. */
export async function mandarRespuestaConsulta(
  consulta: { email: string; asunto: string; descripcion: string },
  respuesta: string,
) {
  if (!transporte) throw new Error("SMTP no está configurado");
  const asunto = consulta.asunto.replace(/\s+/g, " ").trim();
  await transporte.sendMail({
    from: config.mail.remitente,
    to: consulta.email,
    replyTo: config.mail.equipo,
    subject: `Respuesta a tu consulta: ${asunto}`,
    text: `Hola,\n\n${respuesta}\n\n---\nTu consulta: ${consulta.descripcion}\n\nSaludos,\nEquipo Pinz`,
    ...conEncabezado(`<p>Hola,</p><p style="white-space:pre-wrap">${escaparHtml(respuesta)}</p>
<hr><p><strong>Tu consulta:</strong></p><p style="white-space:pre-wrap">${escaparHtml(consulta.descripcion)}</p>
<p>Saludos,<br>Equipo Pinz</p>`),
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
