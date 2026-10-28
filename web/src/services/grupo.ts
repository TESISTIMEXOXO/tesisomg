import { z } from 'zod'
import { pedir } from '../lib/api'
import { InvitacionGrupoSchema, MovimientoSchema } from '../types/grupo'
import type { Rol } from '../types/persona'

export async function invitacion(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/invitacion`, { schema: InvitacionGrupoSchema })
}

export async function movimientos(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/movimientos`, { schema: z.array(MovimientoSchema) })
}

export function invitarPorMail(viajeId: string, mail: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/invitar`, { method: 'POST', body: { email: mail } })
}

/** Solo el organizador puede cambiar roles. */
export function cambiarRol(viajeId: string, personaId: string, rol: Rol) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/miembros/${encodeURIComponent(personaId)}`, {
    method: 'PATCH',
    body: { rol },
  })
}

/** El backend devuelve lo pendiente si hay deudas o reservas a nombre de quien sale. */
export function salir(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/miembros/yo`, { method: 'DELETE' })
}

export function repetir(viajeId: string, modo: 'mismas-personas' | 'mismo-destino') {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/repetir`, {
    method: 'POST',
    body: { modo },
    schema: z.object({ id: z.string() }),
  })
}
