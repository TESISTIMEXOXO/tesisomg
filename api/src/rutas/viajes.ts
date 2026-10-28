import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requiereSesion } from "../auth/sesion.js";
import { Usuario } from "../modelos/Usuario.js";
import { Viaje, type DocViaje } from "../modelos/Viaje.js";

export const rutasViajes = Router();
rutasViajes.use(requiereSesion);

const NuevoViajeSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    destino: z.string().trim().min(1).max(100),
    fechaIda: z.iso.date().nullable(),
    fechaVuelta: z.iso.date().nullable(),
  })
  .refine((viaje) => !viaje.fechaIda || !viaje.fechaVuelta || viaje.fechaVuelta >= viaje.fechaIda, {
    message: "La vuelta tiene que ser después de la ida.",
    path: ["fechaVuelta"],
  });

function viajePublico(viaje: DocViaje, usuarioId: string) {
  return {
    id: viaje.id as string,
    nombre: viaje.nombre,
    destino: viaje.destino,
    fechaIda: viaje.fechaIda ?? null,
    fechaVuelta: viaje.fechaVuelta ?? null,
    personas: viaje.miembros.map((miembro) => ({
      id: miembro.usuarioId.toString(),
      nombre: miembro.nombre,
      pinz: miembro.pinz ?? null,
      rol: miembro.rol,
      esVos: miembro.usuarioId.toString() === usuarioId,
    })),
    pendiente: null,
    estadoCuentas: null,
  };
}

function esMiembro(usuarioId: string) {
  return { "miembros.usuarioId": new mongoose.Types.ObjectId(usuarioId) };
}

rutasViajes.get("/", async (_req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viajes = await Viaje.find(esMiembro(usuarioId)).sort({ createdAt: -1 }).exec();
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

  const viaje = await Viaje.create({
    ...datos.data,
    creadoPor: usuario._id,
    miembros: [
      {
        usuarioId: usuario._id,
        nombre: usuario.nombre || "Organizador",
        pinz: usuario.pinz,
        rol: "organizador",
      },
    ],
  });
  res.status(201).json(viajePublico(viaje, usuarioId));
});

rutasViajes.get("/:id/resumen", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const viaje = await Viaje.findOne({ _id: req.params.id, ...esMiembro(usuarioId) }).select("_id").exec();
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json({ viajeId: viaje.id, pendientes: [], checklist: { hechas: 0, total: 0 } });
});

rutasViajes.get("/:id", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const viaje = await Viaje.findOne({ _id: req.params.id, ...esMiembro(usuarioId) }).exec();
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viajePublico(viaje, usuarioId));
});
