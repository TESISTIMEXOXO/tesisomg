import { z } from 'zod'
import { demora, documentos as documentosMock, requisitos as requisitosMock, sinBackend, tareas as tareasMock } from '../mocks/datos'
import { DocumentoSchema } from '../types/documento'
import { RequisitoSchema, TareaSchema, type NuevaTarea } from '../types/tarea'

export async function tareas(viajeId: string) {
  await demora()
  return z.array(TareaSchema).parse(tareasMock.filter((t) => t.viajeId === viajeId))
}

export async function requisitos(viajeId: string) {
  await demora()
  return z.array(RequisitoSchema).parse(requisitosMock.filter((r) => r.viajeId === viajeId))
}

/** Los documentos del viaje y los personales de quien usa la app. */
export async function documentos(viajeId: string) {
  await demora()
  return z.array(DocumentoSchema).parse(documentosMock.filter((d) => d.viajeId === viajeId || d.personal))
}

export async function documentosPersonales() {
  await demora()
  return z.array(DocumentoSchema).parse(documentosMock.filter((d) => d.personal))
}

export function marcarTarea(viajeId: string, tareaId: string, hecha: boolean) {
  return sinBackend('baul.marcarTarea', { viajeId, tareaId, hecha })
}

export function agregarTarea(viajeId: string, datos: NuevaTarea) {
  return sinBackend('baul.agregarTarea', { viajeId, ...datos })
}

export function subirDocumento(viajeId: string, archivo: File) {
  return sinBackend('baul.subirDocumento', { viajeId, archivo: archivo.name })
}

export function subirDocumentoPersonal(archivo: File) {
  return sinBackend('baul.subirDocumentoPersonal', { archivo: archivo.name })
}

/** El backend devuelve el link (o la copia guardada en el dispositivo, sin conexión). */
export function abrirDocumento(id: string) {
  return sinBackend('baul.abrirDocumento', { id })
}
