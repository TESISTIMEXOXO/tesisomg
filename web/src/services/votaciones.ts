import { z } from 'zod'
import { demora, sinBackend, votaciones } from '../mocks/datos'
import { VotacionSchema, type NuevaOpcion } from '../types/votacion'

export async function listar(viajeId: string) {
  await demora()
  return z.array(VotacionSchema).parse(votaciones.filter((v) => v.viajeId === viajeId))
}

/** Registra (o cambia) el voto de quien usa la app. El backend cierra la votación si se llega a la mayoría. */
export function votar(viajeId: string, votacionId: string, opcionId: string) {
  return sinBackend('votaciones.votar', { viajeId, votacionId, opcionId })
}

export function proponer(viajeId: string, datos: NuevaOpcion) {
  return sinBackend('votaciones.proponer', { viajeId, ...datos })
}
