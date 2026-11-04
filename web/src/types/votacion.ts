import { z } from 'zod'

/** De qué se trata la votación. otros, para lo que no entra en ninguna. */
export const CategoriaVotacionSchema = z.enum(['destino', 'fechas', 'alojamiento', 'actividad', 'comida', 'otros'])

export const OpcionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  /** Precio, distancia o lo que ayude a decidir. */
  detalle: z.string().nullable(),
  /** Ids de las personas que la votaron. */
  votantes: z.array(z.string()),
})

export const VotacionSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  pregunta: z.string(),
  categoria: CategoriaVotacionSchema,
  estado: z.enum(['abierta', 'cerrada']),
  /** Texto ya armado por el backend: "Cierra el viernes". */
  cierre: z.string().nullable(),
  opciones: z.array(OpcionSchema),
  /** La opción que votó quien usa la app. */
  votoPropio: z.string().nullable(),
  ganadoraId: z.string().nullable(),
  /** Ids de quienes todavía no votaron. */
  faltan: z.array(z.string()),
})

export const NuevaOpcionSchema = z.object({
  votacionId: z.string(),
  nombre: z.string().trim().min(1, 'Contanos qué proponés.'),
  detalle: z.string().nullable(),
})

export const CrearVotacionSchema = z.object({
  pregunta: z.string().trim().min(1, 'Escribí la pregunta.'),
  categoria: CategoriaVotacionSchema,
})

/** Lo que puede cambiar quien organiza. Las opciones que no vengan en la lista se borran, con sus votos. */
export const EditarVotacionSchema = z.object({
  pregunta: z.string().trim().min(1, 'Escribí la pregunta.'),
  opciones: z.array(
    z.object({
      id: z.string(),
      nombre: z.string().trim().min(1, 'Ninguna opción puede quedar vacía.'),
    }),
  ),
})

export type Opcion = z.infer<typeof OpcionSchema>
export type Votacion = z.infer<typeof VotacionSchema>
export type NuevaOpcion = z.infer<typeof NuevaOpcionSchema>
export type CrearVotacion = z.infer<typeof CrearVotacionSchema>
export type EditarVotacion = z.infer<typeof EditarVotacionSchema>
export type CategoriaVotacion = z.infer<typeof CategoriaVotacionSchema>
