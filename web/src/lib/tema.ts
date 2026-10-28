export const PREFERENCIAS_TEMA = ['claro', 'oscuro', 'sistema'] as const
export type PreferenciaTema = (typeof PREFERENCIAS_TEMA)[number]

const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)')
const suscriptores = new Set<() => void>()

let preferencia: PreferenciaTema = 'claro'
let soloClaro = false

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
