import { z } from 'zod'
import { pedir } from '../lib/api'
import { CrearVotacionSchema, VotacionSchema, type CrearVotacion, type NuevaOpcion } from '../types/votacion'

export async function listar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/votaciones`, { schema: z.array(VotacionSchema) })
}

/** Registra (o cambia) el voto de quien usa la app. El backend cierra la votación si se llega a la mayoría. */
export function votar(viajeId: string, votacionId: string, opcionId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/votaciones/${encodeURIComponent(votacionId)}/votar`, {
    method: 'POST',
    body: { opcionId },
    schema: VotacionSchema,
  })
}

export function proponer(viajeId: string, datos: NuevaOpcion) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/votaciones/${encodeURIComponent(datos.votacionId)}/opciones`, {
    method: 'POST',
    body: datos,
    schema: VotacionSchema,
  })
}

export function crear(viajeId: string, datos: CrearVotacion) {
  const validos = CrearVotacionSchema.parse(datos)
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/votaciones`, {
    method: 'POST',
    body: validos,
    schema: VotacionSchema,
  })
}
