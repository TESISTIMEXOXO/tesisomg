import type { PuntoMapa } from '../types/itinerario'

export type ParadaMapa = PuntoMapa & {
  /** Solo en actividades: 1 es la más próxima. */
  orden?: number
}

/**
 * Deja en el mapa solo las actividades que todavía no pasaron, numeradas por inmediatez.
 * `pendientes` llega ya ordenado de la más próxima a la más lejana; el resto de las paradas no cambia.
 */
export function numerarParadas(puntos: PuntoMapa[], pendientes: { id: string }[]): ParadaMapa[] {
  const orden = new Map(pendientes.map((actividad, indice) => [actividad.id, indice + 1]))
  return puntos.flatMap((punto) => {
    if (punto.tipo !== 'actividad') return [punto]
    const numero = orden.get(punto.id)
    return numero === undefined ? [] : [{ ...punto, orden: numero }]
  })
}
