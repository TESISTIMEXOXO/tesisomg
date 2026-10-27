import { z } from 'zod'

export const DocumentoSchema = z.object({
  id: z.string(),
  /** null en los documentos personales, que no son de un viaje en particular. */
  viajeId: z.string().nullable(),
  nombre: z.string(),
  tipo: z.enum(['pasaje', 'voucher', 'seguro', 'identidad', 'otro']),
  /** En bytes. */
  tamano: z.number().int().nonnegative(),
  /** Los personales los ve solo su dueño; los del viaje, todo el grupo. */
  personal: z.boolean(),
  /** Para documentos con vencimiento (pasaporte, seguro). AAAA-MM-DD. */
  vence: z.iso.date().nullable(),
})

export type Documento = z.infer<typeof DocumentoSchema>
