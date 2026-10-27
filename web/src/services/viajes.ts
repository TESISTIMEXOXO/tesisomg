import { z } from 'zod'
import { demora, emergencias as emergenciasMock, invitacion, resumenes, sinBackend, viajes } from '../mocks/datos'
import {
  EmergenciasSchema,
  InvitacionSchema,
  ResumenViajeSchema,
  ViajeSchema,
  type NuevoViaje,
} from '../types/viaje'

export async function listar() {
  await demora()
  return z.array(ViajeSchema).parse(viajes)
}

export async function obtener(id: string) {
  await demora()
  const viaje = viajes.find((v) => v.id === id)
  if (!viaje) throw new Error('No encontramos ese viaje.')
  return ViajeSchema.parse(viaje)
}

export async function resumen(id: string) {
  await demora()
  const datos = resumenes.find((r) => r.viajeId === id)
  if (!datos) throw new Error('No pudimos cargar el resumen del viaje.')
  return ResumenViajeSchema.parse(datos)
}

/** Crea el viaje en Previaje, con quien lo crea como organizador. */
export function crear(datos: NuevoViaje) {
  return sinBackend('viajes.crear', datos)
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
