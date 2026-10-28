import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import * as auth from '../services/auth'
import type { Usuario } from '../types/auth'

export function useSesion() {
  return useQuery({ queryKey: ['sesion'], queryFn: auth.obtenerSesion })
}

/* Las que abren sesión la dejan en caché: /ingresar ve la sesión y sigue a la app sin volver a pedirla. */
function useGuardarSesion() {
  const queryClient = useQueryClient()
  return (usuario: Usuario) => queryClient.setQueryData(['sesion'], usuario)
}

export function useEntrarConGoogle() {
  return useMutation({ mutationFn: auth.entrarConGoogle, onSuccess: useGuardarSesion() })
}

export function useRegistrar() {
  return useMutation({
    mutationFn: ({ email, contrasena }: { email: string; contrasena: string }) => auth.registrar(email, contrasena),
  })
}

export function useVerificarRegistro() {
  return useMutation({
    mutationFn: ({ email, codigo }: { email: string; codigo: string }) => auth.verificarRegistro(email, codigo),
    onSuccess: useGuardarSesion(),
  })
}

export function useIngresarConContrasena() {
  return useMutation({
    mutationFn: ({ email, contrasena }: { email: string; contrasena: string }) => auth.ingresarConContrasena(email, contrasena),
    onSuccess: useGuardarSesion(),
  })
}

export function usePedirRecuperar() {
  return useMutation({ mutationFn: (email: string) => auth.pedirRecuperar(email) })
}

export function useRecuperar() {
  return useMutation({
    mutationFn: ({ email, codigo, contrasena }: { email: string; codigo: string; contrasena: string }) =>
      auth.recuperar(email, codigo, contrasena),
    onSuccess: useGuardarSesion(),
  })
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
