import { z } from 'zod'
import { pedir } from '../lib/api'
import { ListaSchema, type NuevaLista } from '../types/lista'

const base = (viajeId: string) => `/viajes/${encodeURIComponent(viajeId)}/listas`
const deLista = (viajeId: string, listaId: string) => `${base(viajeId)}/${encodeURIComponent(listaId)}`

export function listas(viajeId: string) {
  return pedir(base(viajeId), { schema: z.array(ListaSchema) })
}

export function crearLista(viajeId: string, datos: NuevaLista) {
  return pedir(base(viajeId), { method: 'POST', body: datos, schema: ListaSchema })
}

export function editarLista(viajeId: string, listaId: string, datos: Omit<NuevaLista, 'items'>) {
  return pedir(deLista(viajeId, listaId), { method: 'PATCH', body: datos, schema: ListaSchema })
}

export function borrarLista(viajeId: string, listaId: string) {
  return pedir(deLista(viajeId, listaId), { method: 'DELETE' })
}

export function agregarItem(viajeId: string, listaId: string, titulo: string) {
  return pedir(`${deLista(viajeId, listaId)}/items`, { method: 'POST', body: { titulo }, schema: ListaSchema })
}

export function marcarItem(viajeId: string, listaId: string, itemId: string, hecha: boolean) {
  return pedir(`${deLista(viajeId, listaId)}/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: { hecha } })
}

export function borrarItem(viajeId: string, listaId: string, itemId: string) {
  return pedir(`${deLista(viajeId, listaId)}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
}
