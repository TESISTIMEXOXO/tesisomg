import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as viajes from '../services/viajes'
import type { NuevoViaje } from '../types/viaje'

export function useViajes() {
  return useQuery({ queryKey: ['viajes'], queryFn: viajes.listar })
}

export function useViaje(id: string) {
  return useQuery({ queryKey: ['viajes', id], queryFn: () => viajes.obtener(id) })
}

export function useResumenViaje(id: string) {
  return useQuery({ queryKey: ['viajes', id, 'resumen'], queryFn: () => viajes.resumen(id) })
}

export function useEmergencias(id: string) {
  return useQuery({ queryKey: ['viajes', id, 'emergencias'], queryFn: () => viajes.emergencias(id) })
}

export function useInvitacion(codigo: string) {
  return useQuery({ queryKey: ['invitaciones', codigo], queryFn: () => viajes.verInvitacion(codigo), retry: false })
}

export function useCrearViaje() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: NuevoViaje) => viajes.crear(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}

export function useUnirse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (codigo: string) => viajes.unirse(codigo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}
