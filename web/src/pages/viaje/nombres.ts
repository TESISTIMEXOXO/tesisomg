import type { Persona } from '../../types/persona'

/** El nombre de una persona del grupo como lo dice la interfaz: "vos" si es quien usa la app. */
export function nombreEnElGrupo(personas: Persona[], id: string | null) {
  const persona = personas.find((p) => p.id === id)
  if (!persona) return null
  return persona.esVos ? 'vos' : persona.nombre
}

/** Si quien usa la app puede editar: los lectores solo consultan (HU-08). */
export function puedeEditar(personas: Persona[]) {
  return personas.find((p) => p.esVos)?.rol !== 'lector'
}
