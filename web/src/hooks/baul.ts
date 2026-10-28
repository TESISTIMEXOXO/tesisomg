import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as baul from '../services/baul'
import type { NuevaTarea } from '../types/tarea'

export function useTareas(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'tareas'], queryFn: () => baul.tareas(viajeId) })
}

export function useRequisitos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'requisitos'], queryFn: () => baul.requisitos(viajeId) })
}

export function useDocumentos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'documentos'], queryFn: () => baul.documentos(viajeId) })
}

export function useDocumentosPersonales() {
  return useQuery({ queryKey: ['documentos-personales'], queryFn: baul.documentosPersonales })
}

export function useMarcarTarea(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tareaId, hecha }: { tareaId: string; hecha: boolean }) => baul.marcarTarea(viajeId, tareaId, hecha),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId] }),
  })
}

export function useMarcarRequisito(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requisitoId, cumplido }: { requisitoId: string; cumplido: boolean }) =>
      baul.marcarRequisito(viajeId, requisitoId, cumplido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'requisitos'] }),
  })
}

export function useAgregarTarea(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: NuevaTarea) => baul.agregarTarea(viajeId, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'tareas'] }),
  })
}

export function useSubirDocumentoPersonal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => baul.subirDocumentoPersonal(archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-personales'] }),
  })
}

export function useAbrirDocumento() {
  return useMutation({ mutationFn: (id: string) => baul.abrirDocumento(id) })
}

export function useSubirDocumento(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => baul.subirDocumento(viajeId, archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'documentos'] }),
  })
}
