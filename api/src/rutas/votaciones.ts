import { Router } from "express";
import { z } from "zod";
import { puedeEditarViaje, registrarMovimiento, viajeDelMiembro } from "../viajePublico.js";

export const rutasVotaciones = Router({ mergeParams: true });

const CrearVotacionSchema = z.object({
  pregunta: z.string().trim().min(1).max(160),
  categoria: z.enum(["destino", "fechas", "alojamiento", "actividad", "comida"]),
});
const OpcionSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  detalle: z.string().trim().max(250).nullable(),
});

function votarionPublica(votacion: NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>["votaciones"][number], viaje: NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>, usuarioId: string) {
  const miembros = viaje.miembros.map((miembro) => miembro.usuarioId.toString());
  const votaron = new Set(votacion.opciones.flatMap((opcion) => opcion.votantes.map((id) => id.toString())));
  return {
    id: votacion.id,
    viajeId: viaje._id.toString(),
    pregunta: votacion.pregunta,
    categoria: votacion.categoria,
    estado: votacion.estado,
    cierre: votacion.cierre ?? null,
    opciones: votacion.opciones.map((opcion) => ({
      id: opcion.id,
      nombre: opcion.nombre,
      detalle: opcion.detalle ?? null,
      votantes: opcion.votantes.map((id) => id.toString()),
    })),
    votoPropio: votacion.opciones.find((opcion) => opcion.votantes.some((id) => id.toString() === usuarioId))?.id ?? null,
    ganadoraId: votacion.ganadoraId ?? null,
    faltan: miembros.filter((miembroId) => !votaron.has(miembroId)),
  };
}

rutasVotaciones.get("/", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.votaciones.map((votacion) => votarionPublica(votacion, viaje, usuarioId)));
});

rutasVotaciones.post("/", async (req, res) => {
  const datos = CrearVotacionSchema.safeParse(req.body);
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
  const votacion = { id: crypto.randomUUID(), ...datos.data, estado: "abierta" as const, opciones: [], ganadoraId: null, cierre: null };
  viaje.votaciones.push(votacion);
  const persona = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  registrarMovimiento(viaje, `${persona?.nombre ?? "Alguien"} creó la votación “${votacion.pregunta}”`);
  await viaje.save();
  const creada = viaje.votaciones.find((item) => item.id === votacion.id);
  res.status(201).json(votarionPublica(creada!, viaje, usuarioId));
});

rutasVotaciones.post("/:votacionId/opciones", async (req, res) => {
  const datos = OpcionSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const parametros = req.params as { id: string; votacionId: string };
  const viaje = await viajeDelMiembro(parametros.id, usuarioId);
  const votacion = viaje?.votaciones.find((item) => item.id === parametros.votacionId);
  if (!viaje || !votacion) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (votacion.estado !== "abierta") {
    res.status(409).json({ error: "votacion-cerrada" });
    return;
  }
  votacion.opciones.push({ id: crypto.randomUUID(), ...datos.data, votantes: [] });
  await viaje.save();
  res.status(201).json(votarionPublica(votacion, viaje, usuarioId));
});

rutasVotaciones.post("/:votacionId/votar", async (req, res) => {
  const datos = z.object({ opcionId: z.string().min(1) }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const parametros = req.params as { id: string; votacionId: string };
  const viaje = await viajeDelMiembro(parametros.id, usuarioId);
  const votacion = viaje?.votaciones.find((item) => item.id === parametros.votacionId);
  const opcion = votacion?.opciones.find((item) => item.id === datos.data.opcionId);
  if (!viaje || !votacion || !opcion) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (votacion.estado !== "abierta") {
    res.status(409).json({ error: "votacion-cerrada" });
    return;
  }
  const usuarioObjectId = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId)?.usuarioId;
  if (!usuarioObjectId) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  for (const opcionActual of votacion.opciones) {
    opcionActual.votantes = opcionActual.votantes.filter((id) => id.toString() !== usuarioId);
  }
  opcion.votantes.push(usuarioObjectId);
  const mayorias = Math.floor(viaje.miembros.length / 2) + 1;
  if (opcion.votantes.length >= mayorias) {
    votacion.estado = "cerrada";
    votacion.ganadoraId = opcion.id;
  }
  await viaje.save();
  res.json(votarionPublica(votacion, viaje, usuarioId));
});
