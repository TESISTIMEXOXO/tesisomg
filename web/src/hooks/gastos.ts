import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as gastos from '../services/gastos'
import type { NuevoGasto } from '../types/gasto'

export function useGastos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'gastos'], queryFn: () => gastos.listar(viajeId) })
}

export function useSaldos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'saldos'], queryFn: () => gastos.saldos(viajeId) })
}

function useInvalidarCuentas(viajeId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'gastos'] }),
      queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'saldos'] }),
    ])
}

export function useAgregarGasto(viajeId: string) {
  const invalidar = useInvalidarCuentas(viajeId)
  return useMutation({ mutationFn: (datos: NuevoGasto) => gastos.agregar(viajeId, datos), onSuccess: invalidar })
}

export function useRegistrarPago(viajeId: string) {
  const invalidar = useInvalidarCuentas(viajeId)
  return useMutation({ mutationFn: (personaId: string) => gastos.registrarPago(viajeId, personaId), onSuccess: invalidar })
}

export function useSimplificarCuentas(viajeId: string) {
  const invalidar = useInvalidarCuentas(viajeId)
  return useMutation({ mutationFn: () => gastos.simplificar(viajeId), onSuccess: invalidar })
}

export function useLeerComprobante(viajeId: string) {
  return useMutation({ mutationFn: (archivo: File) => gastos.leerComprobante(viajeId, archivo) })
}
