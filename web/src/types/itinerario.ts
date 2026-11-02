import { z } from 'zod'
import { PinzIdSchema } from './persona'

export const ItemItinerarioSchema = z.object({
  id: z.string(),
  viajeId: z.string(),
  fecha: z.iso.date(),
  /** Hora local del lugar, HH:MM. */
  hora: z.iso.time({ precision: -1 }),
  titulo: z.string(),
  lugar: z.string().nullable(),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  /** Lo calcula el backend con la hora local: hecho, ahora (uno solo) o pendiente. */
  estado: z.enum(['hecho', 'ahora', 'pendiente']),
})

export const NuevoItemItinerarioSchema = ItemItinerarioSchema.pick({
  fecha: true,
  hora: true,
  titulo: true,
  lugar: true,
}).extend({
  lat: z.number().min(-90).max(90).nullable().default(null),
  lng: z.number().min(-180).max(180).nullable().default(null),
}).refine((item) => (item.lat === null) === (item.lng === null), {
  message: 'La latitud y longitud deben informarse juntas.',
})

/** Una parada del mapa: lo que contrata el slot de mapa. */
export const PuntoMapaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  lat: z.number(),
  lng: z.number(),
  tipo: z.enum(['alojamiento', 'actividad', 'comida', 'transporte']),
})

/** Dónde está cada persona que compartió su ubicación (solo durante el viaje). */
export const UbicacionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  pinz: PinzIdSchema.nullable(),
  lat: z.number(),
  lng: z.number(),
})

export const HoySchema = z.object({
  viajeId: z.string(),
  fecha: z.iso.date(),
  dia: z.number().int().positive(),
  totalDias: z.number().int().positive(),
  /** Cómo se llama el día en el itinerario: "a la montaña". */
  titulo: z.string(),
  items: z.array(ItemItinerarioSchema),
  puntos: z.array(PuntoMapaSchema),
  ubicaciones: z.array(UbicacionSchema),
  /** Aviso de choque de horarios o cambio de huso; null si no hay. */
  aviso: z.string().nullable(),
})

export type ItemItinerario = z.infer<typeof ItemItinerarioSchema>
export type NuevoItemItinerario = z.infer<typeof NuevoItemItinerarioSchema>
export type PuntoMapa = z.infer<typeof PuntoMapaSchema>
export type Ubicacion = z.infer<typeof UbicacionSchema>
export type Hoy = z.infer<typeof HoySchema>
