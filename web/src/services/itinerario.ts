import { z } from 'zod'
import { demora, hoy as hoyMock, itinerario, sinBackend } from '../mocks/datos'
import { HoySchema, ItemItinerarioSchema, type NuevoItemItinerario } from '../types/itinerario'

export async function listar(viajeId: string) {
  await demora()
  return z.array(ItemItinerarioSchema).parse(itinerario.filter((item) => item.viajeId === viajeId))
}

/** Qué pasa hoy en el viaje: el itinerario del día, el mapa y dónde está el grupo. */
export async function hoy(viajeId: string) {
  await demora()
  if (hoyMock.viajeId !== viajeId) throw new Error('No pudimos cargar el día.')
  return HoySchema.parse(hoyMock)
}

export function agregar(viajeId: string, datos: NuevoItemItinerario) {
  return sinBackend('itinerario.agregar', { viajeId, ...datos })
}

/** Devuelve el archivo .ics del itinerario para sumarlo al calendario. */
export function exportarCalendario(viajeId: string) {
  return sinBackend('itinerario.exportarCalendario', { viajeId })
}
