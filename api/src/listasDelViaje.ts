import mongoose from "mongoose";
import { Viaje, type DocViaje } from "./modelos/Viaje.js";

/** Las listas que ve esa persona: solo las que integra. */
export function listasDe(viaje: DocViaje, usuarioId: string) {
  return viaje.listas.filter((lista) => lista.participantes.some((id) => id.toString() === usuarioId));
}

/**
 * Pasa las tareas de antes a listas la primera vez que se las pide: las compartidas a una lista del grupo
 * y las personales a una lista de cada persona. La condición evita duplicarlas si llegan dos pedidos juntos.
 */
export async function conListasAlDia(viaje: DocViaje) {
  if (viaje.tareas.length === 0) return viaje;
  const lista = (nombre: string, color: string, grupal: boolean, creadaPor: mongoose.Types.ObjectId, participantes: mongoose.Types.ObjectId[], tareas: DocViaje["tareas"]) => ({
    id: crypto.randomUUID(),
    nombre,
    color,
    grupal,
    creadaPor,
    participantes,
    items: tareas.map(({ id, titulo, hecha, responsableId }) => ({ id, titulo, hecha, responsableId })),
  });
  const compartidas = viaje.tareas.filter((tarea) => tarea.lista === "compartida");
  const personales = new Map<string, DocViaje["tareas"]>();
  for (const tarea of viaje.tareas) {
    if (tarea.lista !== "personal") continue;
    const clave = tarea.creadaPor.toString();
    personales.set(clave, [...(personales.get(clave) ?? []), tarea]);
  }
  const listas = [
    ...(compartidas.length > 0
      ? [lista("Del grupo", "sol", true, viaje.creadoPor, viaje.miembros.map((miembro) => miembro.usuarioId), compartidas)]
      : []),
    ...[...personales.entries()].map(([id, tareas]) => {
      const duenio = new mongoose.Types.ObjectId(id);
      return lista("Mi lista", "cielo", false, duenio, [duenio], tareas);
    }),
  ];
  const actualizado = await Viaje.findOneAndUpdate(
    { _id: viaje._id, "tareas.0": { $exists: true } },
    { $push: { listas: { $each: listas } }, $set: { tareas: [] } },
    { new: true },
  ).exec();
  return actualizado ?? (await Viaje.findById(viaje._id).exec()) ?? viaje;
}
