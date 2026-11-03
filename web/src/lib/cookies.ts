const CLAVE_ACEPTADAS = 'pinz_cookies_aceptadas'
const CLAVE_RECHAZADAS = 'pinz_cookies_rechazadas'

/* Si el navegador no deja guardar nada, no rompe: el aviso vuelve a salir la próxima vez. */
function leer(almacen: () => Storage, clave: string) {
  try {
    return almacen().getItem(clave) !== null
  } catch {
    return false
  }
}

function guardar(almacen: () => Storage, clave: string) {
  try {
    almacen().setItem(clave, 'si')
  } catch {
    // Sin almacenamiento solo se pierde el recuerdo de la elección.
  }
}

const permanente = () => window.localStorage
const deEstaVisita = () => window.sessionStorage

/** Aceptar se recuerda siempre; rechazar, solo hasta cerrar la pestaña: la próxima visita se vuelve a preguntar. */
export function hayQuePreguntarCookies() {
  return !leer(permanente, CLAVE_ACEPTADAS) && !leer(deEstaVisita, CLAVE_RECHAZADAS)
}

export function aceptarCookies() {
  guardar(permanente, CLAVE_ACEPTADAS)
}

export function rechazarCookies() {
  guardar(deEstaVisita, CLAVE_RECHAZADAS)
}
