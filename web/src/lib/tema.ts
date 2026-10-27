/*
 * El tema es una preferencia del dispositivo, no del perfil: vive en localStorage y no pasa por el backend.
 * index.html repite esta resolución en un script en línea para aplicarla antes de pintar.
 */
export const PREFERENCIAS_TEMA = ['claro', 'oscuro', 'sistema'] as const
export type PreferenciaTema = (typeof PREFERENCIAS_TEMA)[number]

const CLAVE = 'pinz-tema'
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)')
const suscriptores = new Set<() => void>()

let preferencia = leerGuardada()
let soloClaro = false

function leerGuardada(): PreferenciaTema {
  try {
    const guardada = localStorage.getItem(CLAVE)
    return PREFERENCIAS_TEMA.find((opcion) => opcion === guardada) ?? 'claro'
  } catch {
    return 'claro'
  }
}

function aplicar() {
  const oscuro = !soloClaro && (preferencia === 'oscuro' || (preferencia === 'sistema' && sistemaOscuro.matches))
  if (oscuro) document.documentElement.dataset.tema = 'oscuro'
  else delete document.documentElement.dataset.tema
}

export function iniciarTema() {
  aplicar()
  sistemaOscuro.addEventListener('change', aplicar)
}

export function preferenciaTema() {
  return preferencia
}

export function elegirTema(nueva: PreferenciaTema) {
  preferencia = nueva
  try {
    localStorage.setItem(CLAVE, nueva)
  } catch {
    // Sin almacenamiento el tema dura lo que la pestaña.
  }
  aplicar()
  suscriptores.forEach((avisar) => avisar())
}

export function suscribirseAlTema(avisar: () => void) {
  suscriptores.add(avisar)
  return () => {
    suscriptores.delete(avisar)
  }
}

/** La landing es la vitrina de la marca y está pensada sobre papel: mientras se ve, la página queda en claro. */
export function forzarClaro(activo: boolean) {
  soloClaro = activo
  aplicar()
}
