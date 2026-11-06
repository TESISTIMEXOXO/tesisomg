import { z } from 'zod'

export const AdminResumenSchema = z.object({
  usuarios: z.number().int().nonnegative(),
  viajes: z.number().int().nonnegative(),
  consultas: z.number().int().nonnegative(),
  consultasPendientes: z.number().int().nonnegative(),
})

export const PaginaAdminSchema = <T extends z.ZodType>(item: T) => z.object({
  items: z.array(item),
  total: z.number().int().nonnegative(),
  pagina: z.number().int().positive(),
  porPagina: z.number().int().positive(),
})

export const ConsultaAdminSchema = z.object({
  id: z.string(),
  email: z.email(),
  asunto: z.string(),
  descripcion: z.string(),
  atendida: z.boolean(),
  confirmacionEnviada: z.boolean(),
  avisoEnviado: z.boolean(),
  creadaEn: z.iso.datetime(),
})

/** Lo que se le contestó a una consulta desde el panel. La API guarda una copia de la consulta: sigue aunque se borre. */
export const RespuestaAdminSchema = z.object({
  id: z.string(),
  texto: z.string(),
  enviadaEn: z.iso.datetime(),
  consulta: z.object({ id: z.string(), email: z.email(), asunto: z.string(), descripcion: z.string() }),
})

export const UsuarioAdminSchema = z.object({
  id: z.string(),
  email: z.email(),
  nombre: z.string(),
  pinz: z.string().nullable(),
  baneado: z.boolean(),
  creadoEn: z.iso.datetime(),
})

export const ViajeAdminSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  destino: z.string(),
  fechaIda: z.iso.date().nullable(),
  fechaVuelta: z.iso.date().nullable(),
  creadoEn: z.iso.datetime(),
  creador: z.object({ email: z.email(), nombre: z.string() }).nullable(),
  personas: z.array(z.object({ nombre: z.string(), rol: z.string() })),
})

export type AdminResumen = z.infer<typeof AdminResumenSchema>
export type ConsultaAdmin = z.infer<typeof ConsultaAdminSchema>
export type RespuestaAdmin = z.infer<typeof RespuestaAdminSchema>
export type UsuarioAdmin = z.infer<typeof UsuarioAdminSchema>
export type ViajeAdmin = z.infer<typeof ViajeAdminSchema>
