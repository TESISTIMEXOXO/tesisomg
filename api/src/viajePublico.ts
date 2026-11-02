import mongoose from "mongoose";
import { Viaje, type DocViaje } from "./modelos/Viaje.js";

type EtapaViaje = NonNullable<DocViaje["etapas"]>[number];

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

export function etapasDelViaje(viaje: DocViaje): EtapaViaje[] {
  if (viaje.etapas.length > 0) return [...viaje.etapas];
  if (!viaje.ubicacion) return [];
  return [{
    id: `etapa-${viaje._id.toString()}`,
    destino: viaje.destino,
    fechaIda: viaje.fechaIda ?? null,
    fechaVuelta: viaje.fechaVuelta ?? null,
    ubicacion: viaje.ubicacion,
  }];
}

export function viajePublico(viaje: DocViaje, usuarioId: string) {
  const etapas = etapasDelViaje(viaje);
  const primeraEtapa = etapas[0];
  const ultimaEtapa = etapas.at(-1);
  return {
    id: viaje._id.toString(),
    nombre: viaje.nombre,
    destino: etapas.length > 1 ? etapas.map((etapa) => etapa.destino).join(" → ") : viaje.destino,
    fechaIda: primeraEtapa?.fechaIda ?? viaje.fechaIda ?? null,
    fechaVuelta: ultimaEtapa?.fechaVuelta ?? viaje.fechaVuelta ?? null,
    ubicacion: primeraEtapa?.ubicacion ?? viaje.ubicacion,
    etapas: etapas.map((etapa) => ({
      id: etapa.id,
      destino: etapa.destino,
      fechaIda: etapa.fechaIda ?? null,
      fechaVuelta: etapa.fechaVuelta ?? null,
      ubicacion: etapa.ubicacion,
    })),
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
