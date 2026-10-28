import { z } from 'zod'
import { MonedaSchema } from './perfil'
import { PinzIdSchema } from './persona'

export const ProveedorSchema = z.enum(['google', 'mail'])

/** La cuenta de la sesión abierta. */
export const UsuarioSchema = z.object({
  id: z.string(),
  email: z.email(),
  nombre: z.string(),
  pinz: PinzIdSchema.nullable(),
  moneda: MonedaSchema,
  /** false hasta que pasa por la bienvenida. */
  perfilCompleto: z.boolean(),
})

export const EmailSchema =z.string().trim().pipe(z.email('Revisá el mail: parece que le falta algo.'))

/** Las mismas reglas que valida el backend. */
export const ContrasenaSchema = z
  .string()
  .min(6, 'Tiene que tener al menos 6 caracteres.')
  .max(128, 'Es demasiado larga.')
  .regex(/\p{Lu}/u, 'Tiene que tener al menos una mayúscula.')

export const RegistroSchema = z.object({ email: EmailSchema, contrasena: ContrasenaSchema })

export const IngresoSchema = z.object({ email: EmailSchema, contrasena: z.string().min(1, 'Escribí tu contraseña.') })

export const CodigoMailSchema = z.string().trim().regex(/^\d{6}$/, 'El código tiene 6 números.')

/** Olvidé mi contraseña, paso 2: el código del mail y la contraseña nueva. */
export const RecuperarSchema = z.object({ codigo: CodigoMailSchema, contrasena: ContrasenaSchema })

/** Por qué el backend rechazó un código. */
export const RechazoCodigoSchema = z.discriminatedUnion('error', [
  z.object({ error: z.literal('codigo-incorrecto'), intentosRestantes: z.number() }),
  z.object({ error: z.enum(['codigo-vencido', 'sin-intentos', 'codigo-invalido']) }),
])

export type Proveedor = z.infer<typeof ProveedorSchema>
export type Usuario = z.infer<typeof UsuarioSchema>
export type RechazoCodigo = z.infer<typeof RechazoCodigoSchema>
