import { z } from 'zod'

/** Los colores que se pueden elegir para una checklist, con el nombre que se lee en voz alta. */
export const COLORES_LISTA = [
  { id: 'coral', nombre: 'Coral' },
  { id: 'sol', nombre: 'Amarillo' },
  { id: 'durazno', nombre: 'Durazno' },
  { id: 'rosa', nombre: 'Rosa' },
  { id: 'lavanda', nombre: 'Lavanda' },
  { id: 'cielo', nombre: 'Celeste' },
  { id: 'mar', nombre: 'Verde agua' },
  { id: 'bosque', nombre: 'Verde' },
] as const

const COLOR_IDS = ['coral', 'sol', 'durazno', 'rosa', 'lavanda', 'cielo', 'mar', 'bosque'] as const

export const ItemListaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  hecha: z.boolean(),
  responsableId: z.string().nullable(),
})

export const ListaSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  nombre: z.string(),
  color: z.enum(COLOR_IDS),
  /** false: la ve solo quien la creó. */
  grupal: z.boolean(),
  creadaPorId: z.string(),
  participantes: z.array(z.string()),
  items: z.array(ItemListaSchema),
})

export type ColorLista = z.infer<typeof ListaSchema>['color']
export type ItemLista = z.infer<typeof ItemListaSchema>
export type Lista = z.infer<typeof ListaSchema>
export type NuevaLista = { nombre: string; color: ColorLista; grupal: boolean; participantes: string[]; items: string[] }
