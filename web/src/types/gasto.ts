import { z } from 'zod'

export const GastoSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  descripcion: z.string(),
  /** En la moneda del viaje, sin decimales. */
  monto: z.number().int().positive(),
  pagoId: z.string(),
  fecha: z.iso.date(),
  division: z.enum(['iguales', 'consumo']),
  participantes: z.array(z.string()).default([]),
})

export const NuevoGastoSchema = z.object({
  descripcion: z.string().trim().min(1, 'Contanos qué fue.'),
  monto: z.number({ error: 'Poné un monto mayor a 0.' }).int().positive('Poné un monto mayor a 0.'),
  division: z.enum(['iguales', 'consumo']),
  participantes: z.array(z.string()).default([]),
})

export type Gasto = z.infer<typeof GastoSchema>
export type NuevoGasto = z.infer<typeof NuevoGastoSchema>
