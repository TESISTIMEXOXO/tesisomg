import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { UbicacionCompartida } from "../modelos/UbicacionCompartida.js";
import { etapasDelViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasUbicaciones = Router({ mergeParams: true });

const ActualizarUbicacionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

function fechaLocal() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

function viajeEnCurso(viaje: NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>) {
  const fecha = fechaLocal();
  return etapasDelViaje(viaje).some((etapa) => etapa.fechaIda && etapa.fechaVuelta && etapa.fechaIda <= fecha && etapa.fechaVuelta >= fecha);
}

rutasUbicaciones.get("/", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!viajeEnCurso(viaje)) {
    res.json([]);
    return;
  }
  const activas = await UbicacionCompartida.find({
    viajeId: viaje._id,
    expiraEn: { $gt: new Date() },
  }).lean().exec();
  const miembros = new Map(viaje.miembros.map((miembro) => [miembro.usuarioId.toString(), miembro]));
  res.json(activas.flatMap((ubicacion) => {
    const miembro = miembros.get(ubicacion.usuarioId.toString());
    if (!miembro) return [];
    return [{
      id: ubicacion.usuarioId.toString(),
      nombre: miembro.nombre,
      pinz: miembro.pinz,
      lat: ubicacion.lat,
      lng: ubicacion.lng,
    }];
  }));
});

rutasUbicaciones.put("/", async (req, res) => {
  const datos = ActualizarUbicacionSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "ubicacion-invalida", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!viajeEnCurso(viaje)) {
    res.status(409).json({ error: "viaje-fuera-de-fechas" });
    return;
  }
  await UbicacionCompartida.findOneAndUpdate(
    { viajeId: viaje._id, usuarioId: new mongoose.Types.ObjectId(usuarioId) },
    { ...datos.data, expiraEn: new Date(Date.now() + 2 * 60 * 1000) },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).exec();
  res.status(204).end();
});

rutasUbicaciones.delete("/", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  await UbicacionCompartida.deleteOne({ viajeId: viaje._id, usuarioId }).exec();
  res.status(204).end();
});
