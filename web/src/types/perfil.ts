import { z } from 'zod'
import { PinzIdSchema } from './persona'

export const MonedaSchema = z.enum(['ARS', 'USD', 'UYU', 'CLP', 'BRL'])
export const TemaSchema = z.enum(['claro', 'oscuro', 'sistema'])

export const PerfilSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  pinz: PinzIdSchema.nullable(),
  moneda: MonedaSchema,
  tema: TemaSchema,
  preferencias: z.object({
    presupuestoPorNoche: z.number().int().nonnegative().nullable(),
    ritmo: z.enum(['tranqui', 'intermedio', 'a full']).nullable(),
    comida: z.string().nullable(),
    alergias: z.string().nullable(),
  }),
  aeropuertos: z.array(z.string()),
  /** Lugares de los viajes que ya cerraron. */
  historial: z.array(
    z.object({
      viajeId: z.string(),
      destino: z.string(),
      fecha: z.iso.date(),
    }),
  ),
})

export const DatosPerfilSchema = z.object({
  nombre: z.string().trim().min(1, 'Contanos cómo te llamás.'),
  pinz: PinzIdSchema.nullable(),
  moneda: MonedaSchema,
  preferencias: z.object({
    presupuestoPorNoche: z.number().int().nonnegative().nullable(),
    ritmo: z.enum(['tranqui', 'intermedio', 'a full']).nullable(),
    comida: z.string().nullable(),
    alergias: z.string().nullable(),
  }).optional(),
  aeropuertos: z.array(z.string().trim().min(1).max(100)).optional(),
  tema: TemaSchema.optional(),
})

export type Perfil = z.infer<typeof PerfilSchema>
export type DatosPerfil = z.infer<typeof DatosPerfilSchema>
export type Moneda = z.infer<typeof MonedaSchema>
