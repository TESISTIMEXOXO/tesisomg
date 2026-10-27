import { sinBackend } from '../mocks/datos'
import type { Proveedor } from '../types/auth'

/** Arranca el ingreso con el proveedor elegido. El OAuth y el mail los resuelve el backend. */
export function ingresar(proveedor: Proveedor) {
  return sinBackend('auth.ingresar', { proveedor })
}

/** Cierra la sesión en el backend. */
export function cerrarSesion() {
  return sinBackend('auth.cerrarSesion', {})
}
