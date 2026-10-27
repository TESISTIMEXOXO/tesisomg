import { z } from 'zod'
import { demora, invitacionesGrupo, movimientos as movimientosMock, sinBackend } from '../mocks/datos'
import { InvitacionGrupoSchema, MovimientoSchema } from '../types/grupo'
import type { Rol } from '../types/persona'

export async function invitacion(viajeId: string) {
  await demora()
  const datos = invitacionesGrupo.find((i) => i.viajeId === viajeId)
  if (!datos) throw new Error('No pudimos cargar la invitación.')
  return InvitacionGrupoSchema.parse(datos)
}

export async function movimientos(viajeId: string) {
  await demora()
  return z.array(MovimientoSchema).parse(movimientosMock.filter((m) => m.viajeId === viajeId))
}

export function invitarPorMail(viajeId: string, mail: string) {
  return sinBackend('grupo.invitarPorMail', { viajeId, mail })
}

/** Solo el organizador puede cambiar roles. */
export function cambiarRol(viajeId: string, personaId: string, rol: Rol) {
  return sinBackend('grupo.cambiarRol', { viajeId, personaId, rol })
}

/** El backend devuelve lo pendiente si hay deudas o reservas a nombre de quien sale. */
export function salir(viajeId: string) {
  return sinBackend('grupo.salir', { viajeId })
}

export function repetir(viajeId: string, modo: 'mismas-personas' | 'mismo-destino') {
  return sinBackend('grupo.repetir', { viajeId, modo })
}
