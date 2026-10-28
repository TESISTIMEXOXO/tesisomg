import mongoose from "mongoose";
import { Viaje, type DocViaje } from "./modelos/Viaje.js";

export function filtroMiembro(usuarioId: string) {
  return { "miembros.usuarioId": new mongoose.Types.ObjectId(usuarioId) };
}

export async function viajeDelMiembro(viajeId: string, usuarioId: string) {
  if (!mongoose.isValidObjectId(viajeId)) return null;
  return Viaje.findOne({ _id: viajeId, ...filtroMiembro(usuarioId) }).exec();
}

export function esOrganizador(viaje: DocViaje, usuarioId: string) {
  return viaje.miembros.some(
    (miembro) => miembro.usuarioId.toString() === usuarioId && miembro.rol === "organizador",
  );
}

export function puedeEditarViaje(viaje: DocViaje, usuarioId: string) {
  return viaje.miembros.some(
    (miembro) => miembro.usuarioId.toString() === usuarioId && miembro.rol !== "lector",
  );
}

export function registrarMovimiento(viaje: DocViaje, texto: string) {
  viaje.movimientos.push({ id: crypto.randomUUID(), texto, creadoEn: new Date() });
}

export function viajePublico(viaje: DocViaje, usuarioId: string) {
  return {
    id: viaje._id.toString(),
    nombre: viaje.nombre,
    destino: viaje.destino,
    fechaIda: viaje.fechaIda ?? null,
    fechaVuelta: viaje.fechaVuelta ?? null,
    ubicacion: viaje.ubicacion
      ? { nombre: viaje.ubicacion.nombre, lat: viaje.ubicacion.lat, lng: viaje.ubicacion.lng }
      : null,
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
