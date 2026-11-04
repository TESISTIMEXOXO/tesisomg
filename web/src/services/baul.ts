import { z } from 'zod'
import { pedir, traerArchivo } from '../lib/api'
import { DocumentoSchema } from '../types/documento'
import { RequisitoSchema } from '../types/tarea'


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


export function marcarRequisito(viajeId: string, requisitoId: string, cumplido: boolean) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/tareas/requisitos/${encodeURIComponent(requisitoId)}`, {
    method: 'PATCH',
    body: { cumplido },
  })
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

/** El archivo del documento, para verlo en la app, bajarlo o compartirlo. */
export function archivoDocumento(id: string) {
  return traerArchivo(`/documentos/${encodeURIComponent(id)}`)
}
