import { z } from 'zod'
import { pedir } from '../lib/api'
import { UbicacionSchema } from '../types/itinerario'

export async function listar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/ubicaciones`, { schema: z.array(UbicacionSchema) })
}

export function actualizar(viajeId: string, ubicacion: { lat: number; lng: number }) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/ubicaciones`, { method: 'PUT', body: ubicacion })
}

export function dejarDeCompartir(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/ubicaciones`, { method: 'DELETE' })
}
