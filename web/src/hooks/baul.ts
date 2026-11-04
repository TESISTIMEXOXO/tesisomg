import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import * as baul from '../services/baul'
import type { Documento } from '../types/documento'


export function useRequisitos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'requisitos'], queryFn: () => baul.requisitos(viajeId) })
}

export function useDocumentos(viajeId: string) {
  return useQuery({ queryKey: ['viajes', viajeId, 'documentos'], queryFn: () => baul.documentos(viajeId) })
}

export function useDocumentosPersonales() {
  return useQuery({ queryKey: ['documentos-personales'], queryFn: baul.documentosPersonales })
}


export function useMarcarRequisito(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requisitoId, cumplido }: { requisitoId: string; cumplido: boolean }) =>
      baul.marcarRequisito(viajeId, requisitoId, cumplido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'requisitos'] }),
  })
}


export function useSubirDocumentoPersonal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => baul.subirDocumentoPersonal(archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-personales'] }),
  })
}

/** El archivo de un documento, mientras esté abierto (id distinto de null). Un archivo no cambia: se trae una vez. */
export function useArchivoDocumento(id: string | null) {
  return useQuery({
    queryKey: ['documentos', id, 'archivo'],
    queryFn: () => baul.archivoDocumento(id ?? ''),
    enabled: id !== null,
    staleTime: Infinity,
  })
}

/** Qué documento está abierto y lo que necesita VistaArchivo para mostrarlo. */
export function useVistaDocumento() {
  const [abierto, setAbierto] = useState<Pick<Documento, 'id' | 'nombre'> | null>(null)
  const archivo = useArchivoDocumento(abierto?.id ?? null)
  return {
    abrir: setAbierto,
    vista: {
      nombre: abierto?.nombre ?? null,
      archivo: archivo.data,
      error: archivo.error,
      onReintentar: () => void archivo.refetch(),
      onClose: () => setAbierto(null),
    },
  }
}

export function useSubirDocumento(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => baul.subirDocumento(viajeId, archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes', viajeId, 'documentos'] }),
  })
}
