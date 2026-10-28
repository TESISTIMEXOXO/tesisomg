/*
 * La ventanita de "Elegí una cuenta" de Google (Google Identity Services, flujo de código en popup).
 * Muestra las cuentas abiertas en el navegador; al elegir una, devuelve un código que el backend canjea.
 */

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined

type RespuestaCodigo = { code?: string; error?: string }
type ClienteCodigo = { requestCode: () => void }
type Gis = {
  accounts: {
    oauth2: {
      initCodeClient: (opciones: {
        client_id: string
        scope: string
        ux_mode: 'popup'
        select_account: boolean
        callback: (respuesta: RespuestaCodigo) => void
        error_callback: (error: { type: string }) => void
      }) => ClienteCodigo
    }
  }
}

declare global {
  interface Window {
    google?: Gis
  }
}

/** Se cerró la ventanita sin elegir cuenta: no es una falla, no hay que mostrar error. */
export class GoogleCancelado extends Error {}

let cargando: Promise<Gis> | undefined

/** Baja el script de Google una sola vez. Conviene llamarla al mostrar el botón, así el click abre la ventanita al toque. */
export function cargarGoogle() {
  cargando ??= new Promise<Gis>((resolver, rechazar) => {
    if (window.google) return resolver(window.google)
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => (window.google ? resolver(window.google) : rechazar(new Error('Google no cargó')))
    script.onerror = () => {
      cargando = undefined
      rechazar(new Error('No se pudo bajar el script de Google'))
    }
    document.head.append(script)
  })
  return cargando
}

/** Abre la ventanita y espera a que la persona elija una cuenta. Devuelve el código para el backend. */
export async function pedirCodigoGoogle() {
  if (!GOOGLE_CLIENT_ID) throw new Error('Falta VITE_GOOGLE_CLIENT_ID')
  const gis = await cargarGoogle()
  return new Promise<string>((resolver, rechazar) => {
    gis.accounts.oauth2
      .initCodeClient({
        client_id: GOOGLE_CLIENT_ID!,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        callback: (respuesta) => (respuesta.code ? resolver(respuesta.code) : rechazar(new GoogleCancelado(respuesta.error))),
        error_callback: (error) => rechazar(error.type === 'popup_closed' ? new GoogleCancelado() : new Error(error.type)),
      })
      .requestCode()
  })
}
