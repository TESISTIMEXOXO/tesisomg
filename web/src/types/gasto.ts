import { z } from 'zod'

const ParteSchema = z.object({ personaId: z.string(), monto: z.number().int() })

export const GastoSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  descripcion: z.string(),
  /** Total pagado, propina incluida, en la moneda del viaje y sin decimales. */
  monto: z.number().int().positive(),
  pagoId: z.string(),
  fecha: z.iso.date(),
  division: z.enum(['iguales', 'consumo']),
  participantes: z.array(z.string()),
  /** Lo que le toca a cada uno, ya con la propina. Lo calcula el backend. */
  partes: z.array(ParteSchema),
  /** Lo que consumió cada uno antes de la propina. Vacío si se dividió en partes iguales. */
  consumos: z.array(ParteSchema),
  /** La propina en pesos. */
  propina: z.number().int(),
  propinaPorcentaje: z.number().int(),
  creadoPorId: z.string(),
})

const CamposGastoSchema = z.object({
  descripcion: z.string().trim().min(1, 'Contanos qué fue.').max(160, 'Usá hasta 160 caracteres.'),
  monto: z
    .number({ error: 'Poné un monto mayor a 0.' })
    .int()
    .positive('Poné un monto mayor a 0.')
    .max(100_000_000, 'Poné un monto de hasta $ 100.000.000.'),
  pagoId: z.string().optional(),
  fecha: z.iso.date('Poné una fecha válida.').optional(),
  participantes: z.array(z.string()).optional(),
})

export const NuevoGastoSchema = z.discriminatedUnion('division', [
  CamposGastoSchema.extend({ division: z.literal('iguales') }),
  CamposGastoSchema.extend({
    division: z.literal('consumo'),
    consumos: z.array(z.object({ personaId: z.string(), monto: z.number().int() })),
    /** Porcentaje: 10 es 10%. */
    propina: z.number().int().min(0).max(100),
  }),
])

/** Lo que se leyó de un comprobante: una sugerencia para el formulario, todavía sin guardar. */
export const ComprobanteLeidoSchema = z.object({
  descripcion: z.string().nullable(),
  monto: z.number().int().positive(),
  fecha: z.string().nullable(),
  moneda: z.string().nullable(),
  monedaDistinta: z.boolean(),
})

export type Gasto = z.infer<typeof GastoSchema>
export type NuevoGasto = z.infer<typeof NuevoGastoSchema>
