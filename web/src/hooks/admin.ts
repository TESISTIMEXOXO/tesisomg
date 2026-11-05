import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as admin from '../services/admin'
import type { OrdenUsuarios } from '../services/admin'

export function useAdminResumen() {
  return useQuery({ queryKey: ['admin', 'resumen'], queryFn: admin.resumen })
}

export function useAdminConsultas(pagina: number) {
  return useQuery({ queryKey: ['admin', 'consultas', pagina], queryFn: () => admin.consultas(pagina) })
}

export function useCambiarEstadoConsulta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, atendida }: { id: string; atendida: boolean }) => admin.cambiarEstadoConsulta(id, atendida),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useResponderConsulta() {
  return useMutation({
    mutationFn: ({ id, respuesta }: { id: string; respuesta: string }) => admin.responderConsulta(id, respuesta),
  })
}

export function useEliminarConsulta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: admin.eliminarConsulta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useAdminUsuarios(pagina: number, busqueda: string, orden: OrdenUsuarios) {
  return useQuery({
    queryKey: ['admin', 'usuarios', pagina, busqueda, orden],
    queryFn: () => admin.usuarios(pagina, busqueda, orden),
  })
}

export function useCambiarBaneoUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, baneado }: { id: string; baneado: boolean }) => admin.cambiarBaneoUsuario(id, baneado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  })
}

export function useAdminViajes(pagina: number) {
  return useQuery({ queryKey: ['admin', 'viajes', pagina], queryFn: () => admin.viajes(pagina) })
}
