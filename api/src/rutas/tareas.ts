import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasTareas = Router({ mergeParams: true });

rutasTareas.get("/", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.tareas
    .filter((tarea) => tarea.lista === "compartida" || tarea.creadaPor.toString() === usuarioId)
    .map((tarea) => ({
      id: tarea.id,
      viajeId: viaje._id.toString(),
      titulo: tarea.titulo,
      lista: tarea.lista,
      responsableId: tarea.responsableId?.toString() ?? null,
      hecha: tarea.hecha,
    })));
});

rutasTareas.post("/", async (req, res) => {
  const datos = z.object({
    titulo: z.string().trim().min(1).max(120),
    lista: z.enum(["compartida", "personal"]),
    responsableId: z.string().nullable(),
  }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (datos.data.responsableId && !viaje.miembros.some((miembro) => miembro.usuarioId.toString() === datos.data.responsableId)) {
    res.status(400).json({ error: "responsable-no-es-miembro" });
    return;
  }
  const tarea = {
    id: crypto.randomUUID(),
    ...datos.data,
    responsableId: datos.data.responsableId ? new mongoose.Types.ObjectId(datos.data.responsableId) : null,
    creadaPor: new mongoose.Types.ObjectId(usuarioId),
    hecha: false,
  };
  viaje.tareas.push(tarea);
  await viaje.save();
  res.status(201).json({
    id: tarea.id,
    viajeId: viaje._id.toString(),
    titulo: tarea.titulo,
    lista: tarea.lista,
    responsableId: tarea.responsableId,
    hecha: tarea.hecha,
  });
});

rutasTareas.get("/requisitos", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.requisitos.map((requisito) => ({
    id: requisito.id,
    viajeId: viaje._id.toString(),
    titulo: requisito.titulo,
    detalle: requisito.detalle,
    cumplido: requisito.cumplidoPor.some((id) => id.toString() === usuarioId),
  })));
});

rutasTareas.patch("/requisitos/:requisitoId", async (req, res) => {
  const datos = z.object({ cumplido: z.boolean() }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const parametros = req.params as { id: string; requisitoId: string };
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(parametros.id, usuarioId);
  const requisito = viaje?.requisitos.find((item) => item.id === parametros.requisitoId);
  const miembroId = viaje?.miembros.find((item) => item.usuarioId.toString() === usuarioId)?.usuarioId;
  if (!viaje || !requisito || !miembroId) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  requisito.cumplidoPor = requisito.cumplidoPor.filter((id) => id.toString() !== usuarioId);
  if (datos.data.cumplido) requisito.cumplidoPor.push(miembroId);
  await viaje.save();
  res.status(204).end();
});

rutasTareas.patch("/:tareaId", async (req, res) => {
  const datos = z.object({ hecha: z.boolean() }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const parametros = req.params as { id: string; tareaId: string };
  const viaje = await viajeDelMiembro(parametros.id, usuarioId);
  const tarea = viaje?.tareas.find((item) => item.id === parametros.tareaId);
  if (!viaje || !tarea) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (tarea.lista === "personal" && tarea.creadaPor.toString() !== usuarioId) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  tarea.hecha = datos.data.hecha;
  await viaje.save();
  res.json({ ok: true });
});
