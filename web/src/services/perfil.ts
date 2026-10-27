import { demora, perfil, sinBackend } from '../mocks/datos'
import { PerfilSchema, type DatosPerfil } from '../types/perfil'

export async function obtener() {
  await demora()
  return PerfilSchema.parse(perfil)
}

export function guardar(datos: DatosPerfil) {
  return sinBackend('perfil.guardar', datos)
}
