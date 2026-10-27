import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as grupo from '../services/grupo'
import type { Rol } from '../types/persona'

export function useInvitacionGrupo(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'invitacion'], queryFn: () => grupo.invitacion(viajeId) })
}

export function useMovimientos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'movimientos'], queryFn: () => grupo.movimientos(viajeId) })
}

export function useInvitarPorMail(viajeId: string) {
  return useMutation({ mutationFn: (mail: string) => grupo.invitarPorMail(viajeId, mail) })
}

export function useCambiarRol(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ personaId, rol }: { personaId: string; rol: Rol }) => grupo.cambiarRol(viajeId, personaId, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId] }),
  })
}

export function useSalirDelGrupo(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => grupo.salir(viajeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}

export function useRepetirViaje(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modo: 'mismas-personas' | 'mismo-destino') => grupo.repetir(viajeId, modo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}
