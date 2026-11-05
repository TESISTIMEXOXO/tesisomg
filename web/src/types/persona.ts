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
  /** Cuántas veces la sacaron de este viaje. Solo llega si quien mira organiza: a la tercera, no puede volver. */
  vecesSacado: z.number().int().nonnegative().optional(),
})

/** Tres strikes: a la tercera vez que sacan a alguien del viaje, ya no puede volver (igual que en la API). */
export const MAX_EXPULSIONES = 3

export type Persona = z.infer<typeof PersonaSchema>
export type Rol = z.infer<typeof RolSchema>
