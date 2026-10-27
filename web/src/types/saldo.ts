import { z } from 'zod'
import { PersonaSchema } from './persona'

/** Cómo queda quien usa la app con otra persona. Lo calcula el backend (cuentas simplificadas). */
export const SaldoSchema = z.object({
  persona: PersonaSchema.pick({ id: true, nombre: true, pinz: true }),
  /** Positivo: le tienen que devolver. Negativo: le falta poner. Cero: están a mano. */
  monto: z.number().int(),
})

export const SaldosSchema = z.object({
  viajeId: z.string(),
  moneda: z.string(),
  saldos: z.array(SaldoSchema),
})

export type Saldo = z.infer<typeof SaldoSchema>
export type Saldos = z.infer<typeof SaldosSchema>
