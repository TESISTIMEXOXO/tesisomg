import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as itinerario from '../services/itinerario'
import type { NuevoItemItinerario } from '../types/itinerario'

/* Cada 30 segundos, con la pestaña a la vista: así aparece lo que cargan los demás. */
export function useItinerario(viajeId: string) {
  return useQuery({
    queryKey: ['viajes', viajeId, 'itinerario'],
    queryFn: () => itinerario.listar(viajeId),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useHoy(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'hoy'], queryFn: () => itinerario.hoy(viajeId) })
}

export function useAgregarActividad(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: NuevoItemItinerario) => itinerario.agregar(viajeId, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'itinerario'] }),
  })
}

export function useExportarCalendario(viajeId: string) {
  return useMutation({ mutationFn: () => itinerario.exportarCalendario(viajeId) })
}

export function useEnlaceCalendario(viajeId: string) {
  return useMutation({ mutationFn: () => itinerario.enlaceCalendario(viajeId) })
}
