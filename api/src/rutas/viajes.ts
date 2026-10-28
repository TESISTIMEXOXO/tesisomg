import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { mandarInvitacion } from "../auth/mail.js";
import { requiereSesion } from "../auth/sesion.js";
import { Usuario } from "../modelos/Usuario.js";
import { Viaje } from "../modelos/Viaje.js";
import { filtroMiembro, puedeEditarViaje, registrarMovimiento, viajeDelMiembro, viajePublico } from "../viajePublico.js";

export const rutasViajes = Router();
rutasViajes.use(requiereSesion);

const NuevoViajeSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    destino: z.string().trim().min(1).max(100),
    fechaIda: z.iso.date().nullable(),
    fechaVuelta: z.iso.date().nullable(),
    ubicacion: z.object({ nombre: z.string().min(1), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
  })
  .refine((viaje) => !viaje.fechaIda || !viaje.fechaVuelta || viaje.fechaVuelta >= viaje.fechaIda, {
    message: "La vuelta tiene que ser después de la ida.",
    path: ["fechaVuelta"],
  });

rutasViajes.get("/invitacion/:codigo", async (req, res) => {
  const codigo = req.params.codigo?.toUpperCase();
  const viaje = codigo ? await Viaje.findOne({ codigoInvitacion: codigo }).exec() : null;
  if (!viaje) {
    res.status(404).json({ error: "invitacion-no-encontrada" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
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
  if (!viaje.miembros.some((miembro) => miembro.usuarioId.toString() === usuarioId)) {
    viaje.miembros.push({
      usuarioId: usuario._id,
      nombre: usuario.nombre || "Integrante",
      pinz: usuario.pinz ?? null,
      rol: "miembro",
    });
    registrarMovimiento(viaje, `${usuario.nombre || "Alguien"} se sumó al viaje`);
    await viaje.save();
  }
  res.json(viajePublico(viaje, usuarioId));
});

rutasViajes.get("/", async (_req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viajes = await Viaje.find(filtroMiembro(usuarioId)).sort({ createdAt: -1 }).exec();
  res.json(viajes.map((viaje) => viajePublico(viaje, usuarioId)));
});

rutasViajes.post("/", async (req, res) => {
  const datos = NuevoViajeSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
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
    creadoPor: usuario._id,
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
  const persona = await Usuario.findOne({ email: correo }).exec();
  if (persona && !viaje.miembros.some((miembro) => miembro.usuarioId.toString() === persona.id)) {
    viaje.miembros.push({ usuarioId: persona._id, nombre: persona.nombre || "Integrante", pinz: persona.pinz ?? null, rol: "miembro" });
    registrarMovimiento(viaje, `${persona.nombre || "Alguien"} se sumó al viaje`);
    await viaje.save();
  }
  await mandarInvitacion(correo, { nombre: viaje.nombre, destino: viaje.destino, codigo: viaje.codigoInvitacion }, quienInvita.nombre);
  res.status(204).end();
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

rutasViajes.delete("/:id/miembros/yo", async (req, res) => {
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
  if (miembro.rol === "organizador" && viaje.miembros.length > 1) {
    res.status(409).json({ error: "transferir-organizacion-antes-de-salir" });
    return;
  }
  if (viaje.miembros.length === 1) await viaje.deleteOne();
  else {
    viaje.miembros = viaje.miembros.filter((persona) => persona.usuarioId.toString() !== usuarioId);
    await viaje.save();
  }
  res.status(204).end();
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
    creadoPor: usuario._id,
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
  const tareas = viaje.tareas.filter((tarea) => tarea.lista === "compartida");
  res.json({ viajeId: viaje._id.toString(), pendientes: [], checklist: { hechas: tareas.filter((tarea) => tarea.hecha).length, total: tareas.length } });
});

rutasViajes.get("/:id", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(req.params.id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viajePublico(viaje, usuarioId));
});
