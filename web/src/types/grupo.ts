import { z } from 'zod'

export const InvitacionGrupoSchema = z.object({
  viajeId: z.string(),
  /** Seis caracteres, siempre a la vista en Grupo. */
  codigo: z.string().length(6),
  link: z.url(),
})

export const MovimientoSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  texto: z.string(),
  /** Texto ya armado: "hace 2 h". */
  cuando: z.string(),
})

export type InvitacionGrupo = z.infer<typeof InvitacionGrupoSchema>
export type Movimiento = z.infer<typeof MovimientoSchema>
