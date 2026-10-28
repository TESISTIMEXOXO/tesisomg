import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as perfil from '../services/perfil'
import type { DatosPerfil } from '../types/perfil'

export function usePerfil() {
  return useQuery({ queryKey: ['perfil'], queryFn: perfil.obtener })
}

export function useGuardarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: DatosPerfil) => perfil.guardar(datos),
    // La sesión también cambia: con nombre, el perfil ya está completo.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['perfil'] }),
        queryClient.invalidateQueries({ queryKey: ['sesion'] }),
      ]),
  })
}
