import { z } from 'zod'
import { PINZ_IDS } from '../pinz/elenco'

export const PinzIdSchema = z.enum(PINZ_IDS)

export const RolSchema = z.enum(['organizador', 'miembro', 'lector'])

export const PersonaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  /** El personaje que eligió. null si todavía no eligió: se pinta con un tono de la paleta. */
  pinz: PinzIdSchema.nullable(),
  rol: RolSchema,
  /** Si es la persona que está usando la app. */
  esVos: z.boolean(),
})

export type Persona = z.infer<typeof PersonaSchema>
export type Rol = z.infer<typeof RolSchema>
