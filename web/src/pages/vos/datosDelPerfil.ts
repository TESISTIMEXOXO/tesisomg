import type { DatosPerfil, Perfil } from '../../types/perfil'

/** Lo que se manda al guardar: el perfil completo, para cambiar una sola cosa sin pisar el resto. */
export function datosDelPerfil(perfil: Perfil): DatosPerfil {
  return {
    nombre: perfil.nombre,
    pinz: perfil.pinz,
    moneda: perfil.moneda,
    tema: perfil.tema,
    preferencias: perfil.preferencias,
    aeropuertos: perfil.aeropuertos,
  }
}
