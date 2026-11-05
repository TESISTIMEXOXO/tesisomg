import mongoose from "mongoose";
import { netosDe } from "./cuentas/delViaje.js";
import { vecesSacado } from "./expulsiones.js";
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

/** "todos a mano" cuando hubo gastos y ya nadie le debe nada a nadie. */
function estadoDeCuentas(viaje: DocViaje) {
  if (viaje.gastos.length === 0) return null;
  return [...netosDe(viaje).values()].every((neto) => neto === 0) ? "todos a mano" : null;
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
  // Cuántas veces sacaron a cada uno solo lo ve quien puede sacar gente: para avisarle antes del tercer strike.
  const veOrganizador = esOrganizador(viaje, usuarioId);
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
      ...(veOrganizador ? { vecesSacado: vecesSacado(viaje, miembro.usuarioId.toString()) } : {}),
    })),
    pendiente: null,
    estadoCuentas: estadoDeCuentas(viaje),
  };
}

/** La fecha de hoy (AAAA-MM-DD) desplazada esas horas respecto de UTC. */
function fechaDesplazada(ahora: Date, horas: number) {
  return new Date(ahora.getTime() + horas * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Si el viaje está en curso: ya empezó y no terminó (la etapa "viaje" del front, lib/etapa.ts). Sin fecha de
 * ida, es un previaje. El front usa la fecha del dispositivo; acá cuenta como en curso si lo está en algún lugar
 * del planeta (de UTC-12 a UTC+14), así nunca se deja borrar un viaje que en la pantalla de alguien ya empezó.
 */
export function viajeEnCurso(viaje: DocViaje, ahora = new Date()) {
  const etapas = etapasDelViaje(viaje);
  const fechaIda = etapas[0]?.fechaIda ?? viaje.fechaIda ?? null;
  const fechaVuelta = etapas.at(-1)?.fechaVuelta ?? viaje.fechaVuelta ?? null;
  if (!fechaIda) return false;
  return fechaIda <= fechaDesplazada(ahora, 14) && (!fechaVuelta || fechaVuelta >= fechaDesplazada(ahora, -12));
}
