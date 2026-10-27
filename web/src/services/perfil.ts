import { pedir } from '../lib/api'
import { PerfilSchema, type DatosPerfil } from '../types/perfil'

export function obtener() {
  return pedir('/perfil', { schema: PerfilSchema })
}

export function guardar(datos: DatosPerfil) {
  return pedir('/perfil', { method: 'PUT', body: datos, schema: PerfilSchema })
}
