import { ErrorApi, pedir } from '../lib/api'
import { pedirCodigoGoogle } from '../lib/google'
import { RechazoCodigoSchema, UsuarioSchema } from '../types/auth'

/** La cuenta de la sesión abierta, o null si no hay sesión. */
export async function obtenerSesion() {
  try {
    return await pedir('/auth/yo', { schema: UsuarioSchema })
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 401) return null
    throw error
  }
}

/** Abre la ventanita de Google y, con la cuenta elegida, abre la sesión. Si el mail no tenía cuenta, la crea. */
export async function entrarConGoogle() {
  const code = await pedirCodigoGoogle()
  return pedir('/auth/google', { method: 'POST', body: { code }, schema: UsuarioSchema })
}

/** Crear cuenta, paso 1: guarda la contraseña y manda un código al mail. Pedirlo de nuevo invalida el anterior. */
export function registrar(email: string, contrasena: string) {
  return pedir('/auth/registro', { method: 'POST', body: { email, contrasena } })
}

/** Crear cuenta, paso 2: con el código correcto se crea la cuenta y se abre la sesión. */
export function verificarRegistro(email: string, codigo: string) {
  return pedir('/auth/registro/verificar', { method: 'POST', body: { email, codigo }, schema: UsuarioSchema })
}

/** Entrar a una cuenta que ya existe. */
export function ingresarConContrasena(email: string, contrasena: string) {
  return pedir('/auth/ingresar', { method: 'POST', body: { email, contrasena }, schema: UsuarioSchema })
}

/** Olvidé mi contraseña, paso 1: manda un código al mail de la cuenta. */
export function pedirRecuperar(email: string) {
  return pedir('/auth/recuperar', { method: 'POST', body: { email } })
}

/** Olvidé mi contraseña, paso 2: con el código correcto se cambia la contraseña y se abre la sesión. */
export function recuperar(email: string, codigo: string, contrasena: string) {
  return pedir('/auth/recuperar/verificar', { method: 'POST', body: { email, codigo, contrasena }, schema: UsuarioSchema })
}

/** El código de error que mandó el backend ("ya-registrado", "credenciales-invalidas"…), si mandó uno. */
export function codigoDeError(error: unknown) {
  if (!(error instanceof ErrorApi)) return null
  const cuerpo = error.cuerpo as { error?: unknown } | null
  return typeof cuerpo?.error === 'string' ? cuerpo.error : null
}

/** Si el error es un código de verificación rechazado, dice por qué; si es otra falla (red, servidor), null. */
export function rechazoCodigo(error: unknown) {
  if (!(error instanceof ErrorApi) || error.status !== 400) return null
  const rechazo = RechazoCodigoSchema.safeParse(error.cuerpo)
  return rechazo.success ? rechazo.data : null
}

/** Cierra la sesión en el backend. */
export function cerrarSesion() {
  return pedir('/auth/salir', { method: 'POST' })
}
