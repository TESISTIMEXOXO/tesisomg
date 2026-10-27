import type { TonoPinz } from '../pinz/elenco'
import type { Etapa, Viaje } from '../types/viaje'
import { leerFecha } from './fechas'

export const ETAPAS: Record<Etapa, { nombre: string; tono: TonoPinz }> = {
  previaje: { nombre: 'Previaje', tono: 'sol' },
  viaje: { nombre: 'Viaje', tono: 'mar' },
  post: { nombre: 'Post-viaje', tono: 'lavanda' },
}

/**
 * La etapa activa sale de las fechas: antes de la ida es Previaje, entre la ida y la vuelta
 * (las dos incluidas) es Viaje y después es Post-viaje. Sin fechas, el viaje sigue en Previaje.
 */
export function etapaDelViaje(viaje: Pick<Viaje, 'fechaIda' | 'fechaVuelta'>, hoy = new Date()): Etapa {
  if (!viaje.fechaIda) return 'previaje'
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  if (dia < leerFecha(viaje.fechaIda)) return 'previaje'
  if (!viaje.fechaVuelta || dia <= leerFecha(viaje.fechaVuelta)) return 'viaje'
  return 'post'
}
