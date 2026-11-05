import { pedir } from '../lib/api'
import {
  AdminResumenSchema,
  ConsultaAdminSchema,
  PaginaAdminSchema,
  RespuestaAdminSchema,
  UsuarioAdminSchema,
  ViajeAdminSchema,
} from '../types/admin'

export function resumen() {
  return pedir('/admin/resumen', { schema: AdminResumenSchema })
}

export type OrdenAdmin = 'nuevo' | 'antiguo' | 'alfabetico'

/** Con q busca por mail o asunto; alfabético ordena por mail. */
export function consultas(pagina: number, busqueda: string, orden: OrdenAdmin) {
  const parametros = new URLSearchParams({ pagina: String(pagina), orden })
  if (busqueda) parametros.set('q', busqueda)
  return pedir(`/admin/consultas?${parametros.toString()}`, { schema: PaginaAdminSchema(ConsultaAdminSchema) })
}

export function cambiarEstadoConsulta(id: string, atendida: boolean) {
  return pedir(`/admin/consultas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { atendida },
  })
}

export function responderConsulta(id: string, respuesta: string) {
  return pedir(`/admin/consultas/${encodeURIComponent(id)}/responder`, {
    method: 'POST',
    body: { respuesta },
  })
}

/** Las respuestas ya enviadas, con la consulta a la que contestan. Con q busca por mail, asunto o texto; alfabético ordena por mail. */
export function respuestas(pagina: number, busqueda: string, orden: OrdenAdmin) {
  const parametros = new URLSearchParams({ pagina: String(pagina), orden })
  if (busqueda) parametros.set('q', busqueda)
  return pedir(`/admin/respuestas?${parametros.toString()}`, { schema: PaginaAdminSchema(RespuestaAdminSchema) })
}

export function eliminarConsulta(id: string) {
  return pedir(`/admin/consultas/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function usuarios(pagina: number, busqueda: string, orden: OrdenAdmin) {
  const parametros = new URLSearchParams({ pagina: String(pagina) })
  if (busqueda) parametros.set('q', busqueda)
  parametros.set('orden', orden)
  return pedir(`/admin/usuarios?${parametros.toString()}`, { schema: PaginaAdminSchema(UsuarioAdminSchema) })
}

/** Con q busca por nombre o destino; alfabético ordena por nombre. */
export function viajes(pagina: number, busqueda: string, orden: OrdenAdmin) {
  const parametros = new URLSearchParams({ pagina: String(pagina), orden })
  if (busqueda) parametros.set('q', busqueda)
  return pedir(`/admin/viajes?${parametros.toString()}`, { schema: PaginaAdminSchema(ViajeAdminSchema) })
}
