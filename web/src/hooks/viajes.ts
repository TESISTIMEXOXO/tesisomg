import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSesion } from './auth'
import * as viajes from '../services/viajes'
import type { NuevoViaje, Viaje } from '../types/viaje'

export function useViajes() {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes', sesion?.id],
    queryFn: viajes.listar,
    enabled: Boolean(sesion?.id),
  })
}

export function useViaje(id: string) {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes', sesion?.id, id],
    queryFn: () => viajes.obtener(id),
    enabled: Boolean(sesion?.id && id),
  })
}

export function useResumenViaje(id: string) {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes', sesion?.id, id, 'resumen'],
    queryFn: () => viajes.resumen(id),
    enabled: Boolean(sesion?.id && id),
  })
}

export function useEmergencias(id: string) {
  return useQuery({ queryKey: ['viajes', id, 'emergencias'], queryFn: () => viajes.emergencias(id) })
}

export function useInvitacion(codigo: string) {
  return useQuery({ queryKey: ['invitaciones', codigo], queryFn: () => viajes.verInvitacion(codigo), retry: false })
}

export function useCrearViaje() {
  const queryClient = useQueryClient()
  const { data: sesion } = useSesion()
  return useMutation({
    mutationFn: (datos: NuevoViaje) => viajes.crear(datos),
    onSuccess: (viaje) => {
      const queryKey = ['viajes', sesion?.id] as const
      queryClient.setQueryData<Viaje[]>(queryKey, (actuales) =>
        actuales?.some((actual) => actual.id === viaje.id) ? actuales : [...(actuales ?? []), viaje],
      )
      return queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUnirse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (codigo: string) => viajes.unirse(codigo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}
