import { PINZ_IDS, type PinzId } from '../pinz/elenco'

const CLAVE = 'pinz_resultado_test'

/* El test se hace sin cuenta: el resultado espera en la pestaña hasta que la persona completa su perfil. */
export function recordarPinzDelTest(pinz: PinzId) {
  try {
    window.sessionStorage.setItem(CLAVE, pinz)
  } catch {
    // Sin almacenamiento, en Bienvenida elige a mano.
  }
}

export function leerPinzDelTest(): PinzId | null {
  try {
    const guardado = window.sessionStorage.getItem(CLAVE)
    return PINZ_IDS.find((pinz) => pinz === guardado) ?? null
  } catch {
    return null
  }
}
