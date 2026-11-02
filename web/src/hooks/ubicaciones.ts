import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ubicaciones from '../services/ubicaciones'

export function useUbicaciones(viajeId: string) {
  return useQuery({
    queryKey: ['viajes', viajeId, 'ubicaciones'],
    queryFn: () => ubicaciones.listar(viajeId),
    refetchInterval: 30_000,
  })
}

export function useEnviarUbicacion(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (posicion: { lat: number; lng: number }) => ubicaciones.actualizar(viajeId, posicion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'ubicaciones'] }),
  })
}

export function useDejarDeCompartir(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => ubicaciones.dejarDeCompartir(viajeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'ubicaciones'] }),
  })
}
