import { z } from 'zod'
import { PersonaSchema } from './persona'

export const EtapaSchema = z.enum(['previaje', 'viaje', 'post'])

export const ViajeSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  destino: z.string(),
  /** Fechas en formato AAAA-MM-DD. Sin fechas, el grupo todavía no las decidió. */
  fechaIda: z.iso.date().nullable(),
  fechaVuelta: z.iso.date().nullable(),
  personas: z.array(PersonaSchema),
  /** Lo que le falta hacer a quien está usando la app, en una línea. */
  pendiente: z.string().nullable(),
  /** Cómo quedaron las cuentas, para los viajes pasados ("todos a mano"). */
  estadoCuentas: z.string().nullable(),
})

export const NuevoViajeSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Ponele un nombre al viaje.'),
    destino: z.string().trim().min(1, 'Contanos a dónde van.'),
    fechaIda: z.iso.date().nullable(),
    fechaVuelta: z.iso.date().nullable(),
  })
  .refine((v) => !v.fechaIda || !v.fechaVuelta || v.fechaVuelta >= v.fechaIda, {
    message: 'La vuelta tiene que ser después de la ida.',
    path: ['fechaVuelta'],
  })

export const InvitacionSchema = z.object({
  codigo: z.string(),
  invitaNombre: z.string(),
  viaje: ViajeSchema.pick({ id: true, nombre: true, destino: true, fechaIda: true, fechaVuelta: true, personas: true }),
  /** Si quien abre la invitación ya es parte del grupo: entra directo, sin duplicarse. */
  yaEsMiembro: z.boolean(),
})

export const ResumenViajeSchema = z.object({
  viajeId: z.string(),
  /** Pendientes de quien usa la app: votaciones, tareas a su nombre, requisitos. */
  pendientes: z.array(z.string()),
  checklist: z.object({
    hechas: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
})

export const ContactoEmergenciaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  detalle: z.string(),
  telefono: z.string().nullable(),
})

export const EmergenciasSchema = z.object({
  viajeId: z.string(),
  contactos: z.array(ContactoEmergenciaSchema),
  alojamiento: z.object({
    nombre: z.string(),
    direccion: z.string(),
    /** La dirección en el idioma del lugar, para mostrársela a alguien de ahí. */
    direccionLocal: z.string().nullable(),
  }),
})

export type Etapa = z.infer<typeof EtapaSchema>
export type Viaje = z.infer<typeof ViajeSchema>
export type NuevoViaje = z.infer<typeof NuevoViajeSchema>
export type Invitacion = z.infer<typeof InvitacionSchema>
export type ResumenViaje = z.infer<typeof ResumenViajeSchema>
export type Emergencias = z.infer<typeof EmergenciasSchema>
