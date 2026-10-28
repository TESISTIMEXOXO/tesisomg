import { z } from 'zod'
import { bajarArchivo, pedir } from '../lib/api'
import { DocumentoSchema } from '../types/documento'
import { RequisitoSchema, TareaSchema, type NuevaTarea } from '../types/tarea'

export async function tareas(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas`, { schema: z.array(TareaSchema) })
}

export async function requisitos(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas/requisitos`, { schema: z.array(RequisitoSchema) })
}

/** Los documentos del viaje y los personales de quien usa la app. */
export async function documentos(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/documentos`, { schema: z.array(DocumentoSchema) })
}

export async function documentosPersonales() {
  return pedir('/documentos-personales', { schema: z.array(DocumentoSchema) })
}

export function marcarTarea(viajeId: string, tareaId: string, hecha: boolean) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas/${encodeURIComponent(tareaId)}`, { method: 'PATCH', body: { hecha } })
}

export function marcarRequisito(viajeId: string, requisitoId: string, cumplido: boolean) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas/requisitos/${encodeURIComponent(requisitoId)}`, {
    method: 'PATCH',
    body: { cumplido },
  })
}

export function agregarTarea(viajeId: string, datos: NuevaTarea) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas`, { method: 'POST', body: datos, schema: TareaSchema })
}

export function subirDocumento(viajeId: string, archivo: File) {
  const form = new FormData()
  form.set('archivo', archivo)
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/documentos`, {
    method: 'POST',
    body: form,
    schema: DocumentoSchema,
  })
}

export function subirDocumentoPersonal(archivo: File) {
  const form = new FormData()
  form.set('archivo', archivo)
  return pedir('/documentos-personales', { method: 'POST', body: form, schema: DocumentoSchema })
}

/** El backend devuelve el link (o la copia guardada en el dispositivo, sin conexión). */
export function abrirDocumento(id: string) {
  return bajarArchivo(`/documentos/${encodeURIComponent(id)}`)
}
