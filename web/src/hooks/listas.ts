import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as servicio from '../services/listas'
import type { NuevaLista } from '../types/lista'

export function useListas(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'listas'], queryFn: () => servicio.listas(viajeId) })
}

/** Después de cualquier cambio se refrescan también el resumen y su progreso. */
function useCambioEnListas<T>(viajeId: string, cambio: (datos: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: cambio, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId] }) })
}

export function useCrearLista(viajeId: string) {
  return useCambioEnListas(viajeId, (datos: NuevaLista) => servicio.crearLista(viajeId, datos))
}

export function useEditarLista(viajeId: string, listaId: string) {
  return useCambioEnListas(viajeId, (datos: Omit<NuevaLista, 'items'>) => servicio.editarLista(viajeId, listaId, datos))
}

export function useBorrarLista(viajeId: string) {
  return useCambioEnListas(viajeId, (listaId: string) => servicio.borrarLista(viajeId, listaId))
}

export function useAgregarItem(viajeId: string, listaId: string) {
  return useCambioEnListas(viajeId, (titulo: string) => servicio.agregarItem(viajeId, listaId, titulo))
}

export function useMarcarItem(viajeId: string, listaId: string) {
  return useCambioEnListas(viajeId, ({ itemId, hecha }: { itemId: string; hecha: boolean }) => servicio.marcarItem(viajeId, listaId, itemId, hecha))
}

export function useBorrarItem(viajeId: string, listaId: string) {
  return useCambioEnListas(viajeId, (itemId: string) => servicio.borrarItem(viajeId, listaId, itemId))
}
