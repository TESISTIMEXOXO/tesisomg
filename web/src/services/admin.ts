import { pedir } from '../lib/api'
import {
  AdminResumenSchema,
  ConsultaAdminSchema,
  PaginaAdminSchema,
  UsuarioAdminSchema,
  ViajeAdminSchema,
} from '../types/admin'

export function resumen() {
  return pedir('/admin/resumen', { schema: AdminResumenSchema })
}

export function consultas(pagina: number) {
  return pedir(`/admin/consultas?pagina=${pagina}`, { schema: PaginaAdminSchema(ConsultaAdminSchema) })
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

export function eliminarConsulta(id: string) {
  return pedir(`/admin/consultas/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type OrdenUsuarios = 'nuevo' | 'antiguo' | 'alfabetico'

export function usuarios(pagina: number, busqueda: string, orden: OrdenUsuarios) {
  const parametros = new URLSearchParams({ pagina: String(pagina) })
  if (busqueda) parametros.set('q', busqueda)
  parametros.set('orden', orden)
  return pedir(`/admin/usuarios?${parametros.toString()}`, { schema: PaginaAdminSchema(UsuarioAdminSchema) })
}

export function viajes(pagina: number) {
  return pedir(`/admin/viajes?pagina=${pagina}`, { schema: PaginaAdminSchema(ViajeAdminSchema) })
}
