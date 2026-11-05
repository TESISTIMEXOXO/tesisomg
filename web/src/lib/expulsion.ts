import { ErrorApi } from './api'

export type Expulsion = { viaje: string; por: string; baneado: boolean }

/** Si el error del viaje es que a la persona la sacaron del grupo (410 te-sacaron), quién y de cuál. */
export function expulsionDe(error: unknown): Expulsion | null {
  if (!(error instanceof ErrorApi) || error.status !== 410) return null
  const cuerpo = error.cuerpo as { error?: unknown; viaje?: unknown; por?: unknown; baneado?: unknown } | null
  if (cuerpo?.error !== 'te-sacaron') return null
  return {
    viaje: typeof cuerpo.viaje === 'string' ? cuerpo.viaje : 'el viaje',
    por: typeof cuerpo.por === 'string' ? cuerpo.por : 'Alguien del grupo',
    baneado: cuerpo.baneado === true,
  }
}

/** Si el viaje rechazó a quien quiere entrar porque lo sacaron tres veces (403 baneado). */
export function estaBaneado(error: unknown) {
  if (!(error instanceof ErrorApi) || error.status !== 403) return false
  return (error.cuerpo as { error?: unknown } | null)?.error === 'baneado'
}
