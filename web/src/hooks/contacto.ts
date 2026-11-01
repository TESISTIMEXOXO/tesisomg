import { useMutation } from '@tanstack/react-query'
import * as contacto from '../services/contacto'

export function useEnviarConsulta() {
  return useMutation({ mutationFn: contacto.enviarConsulta })
}
