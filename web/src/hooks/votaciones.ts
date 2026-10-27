import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as votaciones from '../services/votaciones'
import type { NuevaOpcion } from '../types/votacion'

export function useVotaciones(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'votaciones'], queryFn: () => votaciones.listar(viajeId) })
}

export function useVotar(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ votacionId, opcionId }: { votacionId: string; opcionId: string }) =>
      votaciones.votar(viajeId, votacionId, opcionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId] }),
  })
}

export function useProponerOpcion(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: NuevaOpcion) => votaciones.proponer(viajeId, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'votaciones'] }),
  })
}
