import { pedir } from '../lib/api'
import type { Consulta } from '../types/contacto'

/** Guarda la consulta y le manda a la persona un mail de que la recibimos. No necesita sesión. */
export function enviarConsulta(consulta: Consulta) {
  return pedir('/contacto', { method: 'POST', body: consulta })
}
