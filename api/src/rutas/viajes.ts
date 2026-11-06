import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { mandarInvitacion } from "../auth/mail.js";
import { requiereSesion } from "../auth/sesion.js";
import { netosDe } from "../cuentas/delViaje.js";
import { estaBaneado, MAX_EXPULSIONES, vecesSacado } from "../expulsiones.js";
import { conListasAlDia, listasDe } from "../listasDelViaje.js";
import { Usuario } from "../modelos/Usuario.js";
import { UbicacionCompartida } from "../modelos/UbicacionCompartida.js";
import { Viaje } from "../modelos/Viaje.js";
import { esOrganizador, etapasDelViaje, filtroMiembro, puedeEditarViaje, registrarMovimiento, viajeDelMiembro, viajeEnCurso, viajePublico } from "../viajePublico.js";

export const rutasViajes = Router();
rutasViajes.use(requiereSesion);

const NuevoViajeSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    destino: z.string().trim().min(1).max(100),
    fechaIda: z.iso.date().nullable(),
    fechaVuelta: z.iso.date().nullable(),
    ubicacion: z.object({ nombre: z.string().min(1), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
    etapas: z.array(z.object({
      destino: z.string().trim().min(1).max(100),
      fechaIda: z.iso.date().nullable(),
      fechaVuelta: z.iso.date().nullable(),
      ubicacion: z.object({ nombre: z.string().min(1), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
    })).min(1).max(20),
  })
  .refine((viaje) => !viaje.fechaIda || !viaje.fechaVuelta || viaje.fechaVuelta >= viaje.fechaIda, {
    message: "La vuelta tiene que ser después de la ida.",
    path: ["fechaVuelta"],
  });

const EtapaViajeSchema = z.object({
  destino: z.string().trim().min(1).max(100),
  fechaIda: z.iso.date().nullable(),
  fechaVuelta: z.iso.date().nullable(),
  ubicacion: z.object({ nombre: z.string().trim().min(1).max(160), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
}).refine((etapa) => (etapa.fechaIda === null) === (etapa.fechaVuelta === null), {
  message: "Cada etapa necesita fecha de ida y vuelta, o ninguna.",
});

const ActualizarEtapasSchema = z.array(EtapaViajeSchema).min(1).max(20).superRefine((etapas, contexto) => {
  const completas = etapas.filter((etapa) => etapa.fechaIda !== null);
  if (completas.length !== 0 && completas.length !== etapas.length) {
    contexto.addIssue({ code: "custom", message: "Completá las fechas de todas las etapas o dejalas pendientes." });
    return;
  }
  etapas.forEach((etapa, indice) => {
    if (etapa.fechaIda && etapa.fechaVuelta && etapa.fechaVuelta < etapa.fechaIda) {
      contexto.addIssue({
        code: "custom",
        path: [indice, "fechaVuelta"],
        message: "La vuelta de cada etapa tiene que ser después de la ida.",
      });
    }
  });
  for (let indice = 1; indice < etapas.length; indice += 1) {
    const anterior = etapas[indice - 1];
    const actual = etapas[indice];
    if (!anterior || !actual || !anterior.fechaVuelta || !actual.fechaIda) continue;
    const diaSiguiente = new Date(`${anterior.fechaVuelta}T12:00:00Z`);
    diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);
    if (diaSiguiente.toISOString().slice(0, 10) !== actual.fechaIda) {
      contexto.addIssue({
        code: "custom",
        path: [indice, "fechaIda"],
        message: "Las etapas deben ser consecutivas, sin superposiciones ni días libres.",
      });
    }
  }
});

rutasViajes.get("/invitacion/:codigo", async (req, res) => {
  const codigo = req.params.codigo?.toUpperCase();
  const viaje = codigo ? await Viaje.findOne({ codigoInvitacion: codigo }).exec() : null;
  if (!viaje) {
    res.status(404).json({ error: "invitacion-no-encontrada" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  // El link guardado en un mail o un chat no sirve para volver: ni siquiera se muestra el viaje.
  if (estaBaneado(viaje, usuarioId) && !viaje.miembros.some((miembro) => miembro.usuarioId.toString() === usuarioId)) {
    res.status(403).json({ error: "baneado", viaje: viaje.nombre });
    return;
  }
  const quienInvita = await Usuario.findById(viaje.creadoPor).select("nombre").exec();
  const resumen = viajePublico(viaje, usuarioId);
  res.json({
    codigo,
    invitaNombre: quienInvita?.nombre || "Alguien del grupo",
    viaje: {
      id: resumen.id,
      nombre: resumen.nombre,
      destino: resumen.destino,
      fechaIda: resumen.fechaIda,
      fechaVuelta: resumen.fechaVuelta,
      personas: resumen.personas,
      etapas: etapasDelViaje(viaje).map((etapa) => ({
        id: etapa.id,
        destino: etapa.destino,
        fechaIda: etapa.fechaIda ?? null,
        fechaVuelta: etapa.fechaVuelta ?? null,
        ubicacion: etapa.ubicacion,
      })),
    },
    yaEsMiembro: viaje.miembros.some((miembro) => miembro.usuarioId.toString() === usuarioId),
  });
});

rutasViajes.post("/unirse", async (req, res) => {
  const pedido = z.object({ codigo: z.string().trim().length(6) }).safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "codigo-invalido" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const [viaje, usuario] = await Promise.all([
    Viaje.findOne({ codigoInvitacion: pedido.data.codigo.toUpperCase() }).exec(),
    Usuario.findById(usuarioId),
  ]);
  if (!viaje || !usuario) {
    res.status(404).json({ error: !viaje ? "invitacion-no-encontrada" : "sin-sesion" });
    return;
  }
  const yaEstaba = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  // Si lo había borrado de su lista y entra de nuevo con el código, vuelve a aparecerle.
  if (yaEstaba?.oculto) {
    yaEstaba.oculto = false;
    await viaje.save();
  }
  if (!yaEstaba) {
    if (estaBaneado(viaje, usuarioId)) {
      res.status(403).json({ error: "baneado", viaje: viaje.nombre });
      return;
    }
    viaje.miembros.push({
      usuarioId: usuario._id,
      nombre: usuario.nombre || "Integrante",
      pinz: usuario.pinz ?? null,
      rol: "miembro",
    });
    registrarMovimiento(viaje, `${usuario.nombre || "Alguien"} se sumó al viaje`);
    // Si lo habían sacado y vuelve con el código, ya no hay nada que avisarle. Las veces quedan: cuentan para el baneo.
    const expulsion = viaje.expulsados.find((expulsado) => expulsado.usuarioId.toString() === usuarioId);
    if (expulsion) {
      expulsion.avisar = false;
      expulsion.oculto = false;
    }
    await viaje.save();
  }
  res.json(viajePublico(viaje, usuarioId));
});

rutasViajes.get("/", async (_req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viajes = await Viaje.find(filtroMiembro(usuarioId)).sort({ createdAt: -1 }).exec();
  // Los que borró de su lista no aparecen. Si uno empieza (queda en curso), vuelve: ahí sí importa.
  const visibles = viajes.filter((viaje) => {
    const yo = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
    return !yo?.oculto || viajeEnCurso(viaje);
  });
  res.json(visibles.map((viaje) => viajePublico(viaje, usuarioId)));
});

/** Los viajes de los que sacaron a quien pregunta y no volvió, salvo los que ya borró de su lista. */
rutasViajes.get("/sacados", async (_req, res) => {
  const usuarioId = new mongoose.Types.ObjectId(res.locals.usuarioId as string);
  const viajes = await Viaje.find({
    expulsados: { $elemMatch: { usuarioId, avisar: true, oculto: { $ne: true } } },
    "miembros.usuarioId": { $ne: usuarioId },
  })
    .select("nombre destino expulsados")
    .exec();
  res.json(viajes.flatMap((viaje) => {
    const expulsion = viaje.expulsados.find((expulsado) => expulsado.usuarioId.equals(usuarioId));
    if (!expulsion) return [];
    return [{
      id: viaje._id.toString(),
      nombre: viaje.nombre,
      destino: viaje.destino,
      por: expulsion.por,
      en: expulsion.en.toISOString(),
      baneado: expulsion.veces >= MAX_EXPULSIONES,
    }];
  }).sort((a, b) => b.en.localeCompare(a.en)));
});

/**
 * Borrar un viaje de la lista propia: solo desaparece para quien lo pide; el viaje y lo del grupo quedan, y
 * sigue siendo del grupo (para irse está "Salir del viaje"). Se puede con un previaje, con uno que ya pasó o
 * con uno del que lo sacaron; no con uno en curso.
 */
rutasViajes.post("/:id/ocultar", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const viaje = await Viaje.findById(req.params.id).exec();
  const yo = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  const expulsion = viaje?.expulsados.find((expulsado) => expulsado.usuarioId.toString() === usuarioId);
  if (!viaje || (!yo && !expulsion)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (yo) {
    if (viajeEnCurso(viaje)) {
      res.status(409).json({ error: "viaje-en-curso" });
      return;
    }
    yo.oculto = true;
  } else {
    expulsion!.oculto = true;
  }
  await viaje.save();
  res.status(204).end();
});

rutasViajes.post("/", async (req, res) => {
  const datos = NuevoViajeSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const etapas = ActualizarEtapasSchema.safeParse(datos.data.etapas);
  if (!etapas.success) {
    res.status(400).json({ error: "etapas-invalidas", detalle: z.flattenError(etapas.error) });
    return;
  }

  const usuarioId = res.locals.usuarioId as string;
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) {
    res.status(401).json({ error: "sin-sesion" });
    return;
  }

  const codigoInvitacion = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  const viaje = await Viaje.create({
    ...datos.data,
    etapas: etapas.data.map((etapa) => ({ id: crypto.randomUUID(), ...etapa })),
    creadoPor: usuario._id,
    moneda: usuario.moneda,
    codigoInvitacion,
    miembros: [
      {
        usuarioId: usuario._id,
        nombre: usuario.nombre || "Organizador",
        pinz: usuario.pinz ?? null,
        rol: "organizador",
      },
    ],
    emergencias: {
      contactos: [
        { id: "policia", nombre: "Emergencias", detalle: "Policía y emergencias", telefono: "911" },
        { id: "medicas", nombre: "Emergencias médicas", detalle: "Emergencias médicas", telefono: "107" },
        { id: "bomberos", nombre: "Bomberos", detalle: "Incendios y rescate", telefono: "100" },
      ],
      alojamiento: { nombre: "", direccion: "", direccionLocal: null },
    },
  });
  registrarMovimiento(viaje, `${usuario.nombre} armó el viaje`);
  await viaje.save();
  res.status(201).json(viajePublico(viaje, usuarioId));
});

rutasViajes.get("/:id/emergencias", async (req, res) => {
  const viaje = await viajeDelMiembro(req.params.id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json({
    viajeId: viaje._id.toString(),
    contactos: viaje.emergencias.contactos,
    alojamiento: viaje.emergencias.alojamiento,
  });
});

rutasViajes.get("/:id/invitacion", async (req, res) => {
  const viaje = await viajeDelMiembro(req.params.id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json({
    viajeId: viaje._id.toString(),
    codigo: viaje.codigoInvitacion,
    link: `${process.env.WEB_URL || "http://localhost:5173"}/unirse/${viaje.codigoInvitacion}`,
  });
});

rutasViajes.get("/:id/movimientos", async (req, res) => {
  const viaje = await viajeDelMiembro(req.params.id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.movimientos.slice(-20).reverse().map((movimiento) => ({
    id: movimiento.id,
    viajeId: viaje._id.toString(),
    texto: movimiento.texto,
    cuando: new Intl.RelativeTimeFormat("es", { numeric: "auto" }).format(
      -Math.floor((Date.now() - movimiento.creadoEn.getTime()) / 3_600_000),
      "hour",
    ),
  })));
});

rutasViajes.post("/:id/invitar", async (req, res) => {
  const pedido = z.object({ email: z.email() }).safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "email-invalido" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  const quienInvita = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  if (!viaje || !quienInvita) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const correo = pedido.data.email.toLowerCase();
  const yaEsMiembro = await Usuario.findOne({ email: correo }).select("_id").exec();
  if (yaEsMiembro && viaje.miembros.some((miembro) => miembro.usuarioId.toString() === yaEsMiembro.id)) {
    res.status(409).json({ error: "ya-es-miembro" });
    return;
  }
  if (yaEsMiembro && estaBaneado(viaje, yaEsMiembro.id)) {
    res.status(409).json({ error: "persona-baneada" });
    return;
  }
  await mandarInvitacion(correo, { nombre: viaje.nombre, destino: viaje.destino, codigo: viaje.codigoInvitacion }, quienInvita.nombre);
  res.status(204).end();
});

rutasViajes.put("/:id/etapas", async (req, res) => {
  const datos = ActualizarEtapasSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "etapas-invalidas", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  viaje.etapas = datos.data.map((etapa) => ({ id: crypto.randomUUID(), ...etapa }));
  const primera = datos.data[0];
  const ultima = datos.data.at(-1);
  if (!primera || !ultima) {
    res.status(400).json({ error: "etapas-invalidas" });
    return;
  }
  viaje.destino = datos.data.map((etapa) => etapa.destino).join(" → ");
  viaje.ubicacion = primera.ubicacion;
  viaje.fechaIda = primera.fechaIda;
  viaje.fechaVuelta = ultima.fechaVuelta;
  registrarMovimiento(viaje, `${viaje.etapas.length} ${viaje.etapas.length === 1 ? "destino agregado" : "etapas del viaje actualizadas"}`);
  await viaje.save();
  res.json(viajePublico(viaje, usuarioId));
});

rutasViajes.patch("/:id/miembros/:personaId", async (req, res) => {
  const datos = z.object({ rol: z.enum(["organizador", "miembro", "lector"]) }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  const persona = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === req.params.personaId);
  if (!viaje || !persona) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!viaje.miembros.some((miembro) => miembro.usuarioId.toString() === usuarioId && miembro.rol === "organizador")) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (persona.rol === "organizador" && datos.data.rol !== "organizador" && viaje.miembros.filter((miembro) => miembro.rol === "organizador").length === 1) {
    res.status(409).json({ error: "se-necesita-un-organizador" });
    return;
  }
  persona.rol = datos.data.rol;
  await viaje.save();
  res.json(viajePublico(viaje, usuarioId));
});

/*
 * Salir del viaje. Si quien sale es el único organizador y queda gente, tiene que elegir a quién le deja
 * la organización (nuevoOrganizador): se pasa y se sale en el mismo guardado, así el viaje nunca queda sin
 * organizador.
 */
rutasViajes.delete("/:id/miembros/yo", async (req, res) => {
  const pedido = z.object({ nuevoOrganizador: z.string().optional() }).safeParse(req.body ?? {});
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const miembro = viaje.miembros.find((persona) => persona.usuarioId.toString() === usuarioId);
  if (!miembro) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const otros = viaje.miembros.filter((persona) => persona.usuarioId.toString() !== usuarioId);
  const quedaOrganizador = otros.some((persona) => persona.rol === "organizador");
  const sucesor = otros.find((persona) => persona.usuarioId.toString() === pedido.data.nuevoOrganizador);
  if (miembro.rol === "organizador" && otros.length > 0 && !quedaOrganizador && !sucesor) {
    res.status(409).json({ error: "elegir-nuevo-organizador" });
    return;
  }
  if ((netosDe(viaje).get(usuarioId) ?? 0) !== 0) {
    res.status(409).json({ error: "saldo-pendiente" });
    return;
  }
  await UbicacionCompartida.deleteOne({ viajeId: viaje._id, usuarioId }).exec();
  if (otros.length === 0) {
    await Promise.all([
      viaje.deleteOne(),
      UbicacionCompartida.deleteMany({ viajeId: viaje._id }).exec(),
    ]);
  }
  else {
    if (miembro.rol === "organizador" && !quedaOrganizador && sucesor) {
      sucesor.rol = "organizador";
      registrarMovimiento(viaje, `${miembro.nombre} le dejó la organización a ${sucesor.nombre}`);
    }
    viaje.miembros = otros;
    registrarMovimiento(viaje, `${miembro.nombre} salió del viaje`);
    await viaje.save();
  }
  res.status(204).end();
});

/** Echar a alguien del viaje: solo un organizador, y no a sí mismo (para eso está salir). */
rutasViajes.delete("/:id/miembros/:personaId", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!esOrganizador(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (req.params.personaId === usuarioId) {
    res.status(400).json({ error: "usa-salir" });
    return;
  }
  const persona = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === req.params.personaId);
  if (!persona) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  // Igual que al salir: con plata pendiente, las cuentas del grupo quedarían sin cerrar.
  if ((netosDe(viaje).get(req.params.personaId) ?? 0) !== 0) {
    res.status(409).json({ error: "saldo-pendiente" });
    return;
  }
  const quienEcha = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  viaje.miembros = viaje.miembros.filter((miembro) => miembro.usuarioId.toString() !== req.params.personaId);
  const veces = vecesSacado(viaje, req.params.personaId) + 1;
  viaje.expulsados = [
    ...viaje.expulsados.filter((expulsado) => expulsado.usuarioId.toString() !== req.params.personaId),
    { usuarioId: persona.usuarioId, por: quienEcha?.nombre ?? "Alguien del grupo", en: new Date(), veces, avisar: true, oculto: false },
  ];
  registrarMovimiento(
    viaje,
    veces >= MAX_EXPULSIONES
      ? `${quienEcha?.nombre ?? "Alguien"} sacó a ${persona.nombre} del viaje por ${veces}.ª vez: ya no puede volver`
      : `${quienEcha?.nombre ?? "Alguien"} sacó a ${persona.nombre} del viaje`,
  );
  await Promise.all([
    viaje.save(),
    UbicacionCompartida.deleteOne({ viajeId: viaje._id, usuarioId: persona.usuarioId }).exec(),
  ]);
  res.json(viajePublico(viaje, usuarioId));
});

rutasViajes.post("/:id/repetir", async (req, res) => {
  const pedido = z.object({ modo: z.enum(["mismas-personas", "mismo-destino"]) }).safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const original = await viajeDelMiembro(req.params.id, usuarioId);
  if (!original) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) {
    res.status(401).json({ error: "sin-sesion" });
    return;
  }
  const nuevo = await Viaje.create({
    nombre: `Nuevo viaje: ${original.nombre}`,
    destino: original.destino,
    fechaIda: null,
    fechaVuelta: null,
    ubicacion: original.ubicacion,
    etapas: etapasDelViaje(original).map((etapa) => ({
      ...etapa,
      id: crypto.randomUUID(),
      fechaIda: null,
      fechaVuelta: null,
    })),
    creadoPor: usuario._id,
    moneda: usuario.moneda,
    codigoInvitacion: crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase(),
    miembros: pedido.data.modo === "mismas-personas"
      ? original.miembros.map((persona) => ({
          usuarioId: persona.usuarioId,
          nombre: persona.nombre,
          pinz: persona.pinz,
          rol: persona.usuarioId.toString() === usuarioId ? "organizador" as const : persona.rol,
        }))
      : [{ usuarioId: usuario._id, nombre: usuario.nombre || "Organizador", pinz: usuario.pinz ?? null, rol: "organizador" }],
    emergencias: original.emergencias,
  });
  registrarMovimiento(nuevo, `${usuario.nombre} armó el viaje a partir de otro`);
  await nuevo.save();
  res.status(201).json(viajePublico(nuevo, usuarioId));
});

rutasViajes.get("/:id/resumen", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const items = listasDe(await conListasAlDia(viaje), usuarioId).flatMap((lista) => lista.items);
  res.json({ viajeId: viaje._id.toString(), pendientes: [], checklist: { hechas: items.filter((item) => item.hecha).length, total: items.length } });
});

rutasViajes.get("/:id", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    // Si lo sacaron, se le dice (410) para que el front le avise; si no, el viaje no existe para él.
    const delQueLoSacaron = mongoose.isValidObjectId(req.params.id)
      ? await Viaje.findOne({ _id: req.params.id, "expulsados.usuarioId": usuarioId }).select("nombre expulsados").exec()
      : null;
    const expulsion = delQueLoSacaron?.expulsados.find((expulsado) => expulsado.usuarioId.toString() === usuarioId);
    // Al baneado se le avisa siempre; a los demás, hasta que vuelven a sumarse (después pudieron salir solos).
    const baneado = (expulsion?.veces ?? 0) >= MAX_EXPULSIONES;
    if (delQueLoSacaron && expulsion && (expulsion.avisar || baneado)) {
      res.status(410).json({ error: "te-sacaron", viaje: delQueLoSacaron.nombre, por: expulsion.por, baneado });
      return;
    }
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viajePublico(viaje, usuarioId));
});
