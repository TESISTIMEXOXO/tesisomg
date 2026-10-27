import { z } from 'zod'

export const ProveedorSchema = z.enum(['google', 'apple', 'mail'])

export type Proveedor = z.infer<typeof ProveedorSchema>
