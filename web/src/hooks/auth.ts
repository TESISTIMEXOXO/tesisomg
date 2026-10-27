import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Proveedor } from '../types/auth'
import * as auth from '../services/auth'

export function useIngresar() {
  return useMutation({ mutationFn: (proveedor: Proveedor) => auth.ingresar(proveedor) })
}

/** Al cerrar sesión se borra lo cacheado de la cuenta y se vuelve a la landing. */
export function useCerrarSesion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: auth.cerrarSesion,
    onSuccess: () => {
      queryClient.clear()
      navigate('/')
    },
  })
}
