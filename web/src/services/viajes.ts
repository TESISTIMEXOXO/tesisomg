import { z } from 'zod'
import { pedir } from '../lib/api'
import { demora, emergencias as emergenciasMock, invitacion, sinBackend } from '../mocks/datos'
import {
  EmergenciasSchema,
  InvitacionSchema,
  ResumenViajeSchema,
  ViajeSchema,
  type NuevoViaje,
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

/** Guarda el viaje asociado a la cuenta que tiene abierta la sesión. */
export function crear(datos: NuevoViaje) {
  return pedir('/viajes', { method: 'POST', body: datos, schema: ViajeSchema })
}

export async function verInvitacion(codigo: string) {
  await demora()
  if (codigo.toUpperCase() !== invitacion.codigo) {
    throw new Error('Ese código no corresponde a ningún viaje. Revisalo y probá de nuevo.')
  }
  return InvitacionSchema.parse(invitacion)
}

/** Suma a quien usa la app al viaje. Si ya era parte, no lo duplica. */
export function unirse(codigo: string) {
  return sinBackend('viajes.unirse', { codigo })
}

export async function emergencias(id: string) {
  await demora()
  const datos = emergenciasMock.find((e) => e.viajeId === id)
  if (!datos) throw new Error('No pudimos cargar los datos de emergencia.')
  return EmergenciasSchema.parse(datos)
}
