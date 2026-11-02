import { Router } from "express";
import { z } from "zod";
import { puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasTareas = Router({ mergeParams: true });

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

