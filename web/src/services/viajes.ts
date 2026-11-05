import { z } from 'zod'
import { pedir } from '../lib/api'
import {
  EmergenciasSchema,
  InvitacionSchema,
  PaisSchema,
  ResumenViajeSchema,
  ViajeSacadoSchema,
  ViajeSchema,
  type NuevoViaje,
  type EtapaViaje,
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

export function paisEn(lat: number, lng: number) {
  return pedir(`/lugares/pais?lat=${lat}&lng=${lng}`, { schema: PaisSchema })
}

/** Guarda el viaje asociado a la cuenta que tiene abierta la sesión. */
export function crear(datos: NuevoViaje) {
  return pedir('/viajes', { method: 'POST', body: datos, schema: ViajeSchema })
}

export function actualizarEtapas(viajeId: string, etapas: Omit<EtapaViaje, 'id'>[]) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/etapas`, {
    method: 'PUT',
    body: etapas,
    schema: ViajeSchema,
  })
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

/** Los viajes de los que sacaron a quien usa la app y todavía no borró de su lista. */
export async function listarSacados() {
  return pedir('/viajes/sacados', { schema: z.array(ViajeSacadoSchema) })
}

/** Borra el viaje de la lista propia: un viaje que ya pasó o uno del que te sacaron. Para el grupo no cambia nada. */
export function ocultar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/ocultar`, { method: 'POST' })
}
