import { z } from 'zod'
import { EmailSchema } from './auth'

/** "Escribinos" de la landing. Las mismas reglas que valida el backend. */
export const ConsultaSchema = z.object({
  email: EmailSchema,
  asunto: z.string().trim().min(3, 'Contanos el tema en pocas palabras.').max(120, 'Es demasiado largo: dejalo en 120 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .min(10, 'Contanos un poco más: al menos 10 caracteres.')
    .max(2000, 'Es demasiado largo: dejalo en 2000 caracteres.'),
})

export type Consulta = z.infer<typeof ConsultaSchema>
