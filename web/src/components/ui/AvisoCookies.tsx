import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { aceptarCookies, hayQuePreguntarCookies, rechazarCookies } from '../../lib/cookies'
import { Button } from './Button'

/** Abajo en todo el sitio. Donde hay barra de navegación va arriba de ella, para no tapar SOS. */
export function AvisoCookies() {
  const [visible, setVisible] = useState(hayQuePreguntarCookies)
  const { pathname } = useLocation()
  const conBarra = pathname.startsWith('/viajes') || pathname.startsWith('/vos')

  if (!visible) return null

  function responder(guardarRespuesta: () => void) {
    guardarRespuesta()
    setVisible(false)
  }

  return (
    <section aria-label="Aviso de cookies" className={`fixed inset-x-4 z-30 flex justify-center ${conBarra ? 'bottom-24' : 'bottom-4'}`}>
      <div className="flex w-full max-w-120 flex-col gap-3 rounded-lg trazo bg-papel-elevado p-4 shadow-grande">
        <p>Este sitio usa cookies. Las necesarias para iniciar sesión funcionan siempre.</p>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={() => responder(aceptarCookies)}>
            Aceptar cookies
          </Button>
          <Button variant="secundario" size="sm" onClick={() => responder(rechazarCookies)}>
            Rechazar
          </Button>
        </div>
      </div>
    </section>
  )
}
