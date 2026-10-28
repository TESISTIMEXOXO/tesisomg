import type { z } from 'zod'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

/** Error con el status del backend, para distinguir "sin sesión" (401) de una falla. */
export class ErrorApi extends Error {
  readonly status: number
  /** El JSON con el que respondió el backend, si mandó uno (p. ej. { error: 'codigo-incorrecto' }). */
  readonly cuerpo: unknown
  constructor(status: number, mensaje: string, cuerpo: unknown) {
    super(mensaje)
    this.status = status
    this.cuerpo = cuerpo
  }
}

type Opciones = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

/** Pide al backend con la cookie de sesión. Con schema, valida la respuesta; sin schema, no espera cuerpo. */
export async function pedir<T>(ruta: string, opciones: Opciones & { schema: z.ZodType<T> }): Promise<T>
export async function pedir(ruta: string, opciones?: Opciones): Promise<void>
export async function pedir<T>(ruta: string, { method = 'GET', body, schema }: Opciones & { schema?: z.ZodType<T> } = {}) {
  const esFormulario = body instanceof FormData
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    credentials: 'include',
    headers: body === undefined || esFormulario ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : esFormulario ? body : JSON.stringify(body),
  })
  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => null)
    throw new ErrorApi(respuesta.status, `${method} ${ruta} respondió ${respuesta.status}`, cuerpo)
  }
  if (schema) return schema.parse(await respuesta.json())
}

export async function bajarArchivo(ruta: string) {
  const respuesta = await fetch(`${API_URL}${ruta}`, { credentials: 'include' })
  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => null)
    throw new ErrorApi(respuesta.status, `GET ${ruta} respondió ${respuesta.status}`, cuerpo)
  }
  const blob = await respuesta.blob()
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = decodeURIComponent(respuesta.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] ?? 'documento')
  enlace.click()
  URL.revokeObjectURL(url)
}
