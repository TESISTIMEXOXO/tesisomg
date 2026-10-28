import { z } from 'zod'
import { pedir } from '../lib/api'
import {
  EmergenciasSchema,
  InvitacionSchema,
  ResumenViajeSchema,
  ViajeSchema,
  type NuevoViaje,
  SugerenciaLugarSchema,
} from '../types/viaje'

export async function listar() {
  return pedir('/viajes', { schema: z.array(ViajeSchema) })
}

export async function obtener(id: string) {
  return pedir(`/viajes/${encodeURIComponent(id)}`, { schema: ViajeSchema })
}

export async function resumen(id: string) {
  return pedir(`/viajes/${encodeURIComponent(id)}/resumen`, { schema: ResumenViajeSchema })
}

export function buscarLugares(consulta: string) {
  return pedir(`/lugares?q=${encodeURIComponent(consulta)}`, { schema: z.array(SugerenciaLugarSchema) })
}

/** Guarda el viaje asociado a la cuenta que tiene abierta la sesión. */
export function crear(datos: NuevoViaje) {
  return pedir('/viajes', { method: 'POST', body: datos, schema: ViajeSchema })
}

export async function verInvitacion(codigo: string) {
  return pedir(`/viajes/invitacion/${encodeURIComponent(codigo.toUpperCase())}`, { schema: InvitacionSchema })
}

/** Suma a quien usa la app al viaje. Si ya era parte, no lo duplica. */
export function unirse(codigo: string) {
  return pedir('/viajes/unirse', { method: 'POST', body: { codigo }, schema: ViajeSchema })
}

export async function emergencias(id: string) {
  return pedir(`/viajes/${encodeURIComponent(id)}/emergencias`, { schema: EmergenciasSchema })
}
