import { z } from 'zod'

export const RequisitoSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  titulo: z.string(),
  detalle: z.string(),
  /** Si quien usa la app ya lo tiene resuelto. */
  cumplido: z.boolean(),
})

export type Requisito = z.infer<typeof RequisitoSchema>
