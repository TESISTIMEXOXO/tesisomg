import { z } from 'zod'
import { bajarArchivo, pedir } from '../lib/api'
import { HoySchema, ItemItinerarioSchema, type NuevoItemItinerario } from '../types/itinerario'

export async function listar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/itinerario`, { schema: z.array(ItemItinerarioSchema) })
}

/** Qué pasa hoy en el viaje: el itinerario del día, el mapa y dónde está el grupo. */
export async function hoy(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/itinerario/hoy`, { schema: HoySchema })
}

export function agregar(viajeId: string, datos: NuevoItemItinerario) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/itinerario`, {
    method: 'POST',
    body: datos,
    schema: ItemItinerarioSchema,
  })
}

/** Devuelve el archivo .ics del itinerario para sumarlo al calendario. */
export function exportarCalendario(viajeId: string) {
  return bajarArchivo(`/viajes/${encodeURIComponent(viajeId)}/itinerario/calendario`)
}
