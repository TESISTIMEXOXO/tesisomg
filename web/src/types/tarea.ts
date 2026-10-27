import { z } from 'zod'

export const TareaSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  titulo: z.string(),
  /** compartida la ve todo el grupo; personal, solo quien la creó. */
  lista: z.enum(['compartida', 'personal']),
  responsableId: z.string().nullable(),
  hecha: z.boolean(),
})

export const NuevaTareaSchema = z.object({
  titulo: z.string().trim().min(1, 'Contanos qué hay que hacer.'),
  lista: TareaSchema.shape.lista,
  responsableId: z.string().nullable(),
})

export const RequisitoSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  titulo: z.string(),
  detalle: z.string(),
  /** Si quien usa la app ya lo tiene resuelto. */
  cumplido: z.boolean(),
})

export type Tarea = z.infer<typeof TareaSchema>
export type NuevaTarea = z.infer<typeof NuevaTareaSchema>
export type Requisito = z.infer<typeof RequisitoSchema>
