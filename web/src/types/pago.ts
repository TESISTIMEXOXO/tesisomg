import { z } from 'zod'

/** Un pago entre dos personas. Sólo cuenta en los saldos cuando quien lo recibe lo confirma. */
export const PagoSchema = z.object({
  id: z.string(),
  deudorId: z.string(),
  acreedorId: z.string(),
  monto: z.number().int().positive(),
  fecha: z.iso.date(),
  estado: z.enum(['pendiente', 'confirmado', 'rechazado']),
})

export type Pago = z.infer<typeof PagoSchema>
