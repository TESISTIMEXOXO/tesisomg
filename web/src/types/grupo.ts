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
  /** Texto ya armado, siempre en horas: "hace 2 horas". Las pantallas lo pasan a días con cuandoEnDias. */
  cuando: z.string(),
})

export type InvitacionGrupo = z.infer<typeof InvitacionGrupoSchema>
export type Movimiento = z.infer<typeof MovimientoSchema>
