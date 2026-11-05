const CLAVE = 'pinz_invitacion_pendiente'

/* Solo códigos de invitación, nunca una ruta cualquiera: así nadie puede armar un link que, después de
   ingresar, mande a otro lado. */
const CODIGO = /^[A-Z0-9]{6}$/

/*
 * Quien abre el link de una invitación sin sesión tiene que entrar o crear su cuenta (y, si es nueva,
 * completar el perfil). El código espera en la pestaña y al terminar se vuelve a la invitación.
 */
export function recordarInvitacion(codigo: string) {
  const limpio = codigo.toUpperCase()
  if (!CODIGO.test(limpio)) return
  try {
    window.sessionStorage.setItem(CLAVE, limpio)
  } catch {
    // Sin almacenamiento, después de ingresar va a Mis viajes y tiene que volver a abrir el link.
  }
}

export function olvidarInvitacion() {
  try {
    window.sessionStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}

/** A dónde seguir después de ingresar o completar el perfil: la invitación pendiente, si hay una. */
export function destinoDespuesDeIngresar() {
  try {
    const codigo = window.sessionStorage.getItem(CLAVE)
    return codigo && CODIGO.test(codigo) ? `/unirse/${codigo}` : '/viajes'
  } catch {
    return '/viajes'
  }
}

export function hayInvitacionPendiente() {
  return destinoDespuesDeIngresar() !== '/viajes'
}
