import { useState } from 'react'
import { Cookie } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { aceptarCookies, hayQuePreguntarCookies, rechazarCookies } from '../../lib/cookies'
import { Button } from './Button'

/**
 * Abajo a la derecha. En mobile, donde hay barra de navegación, va arriba de ella para no tapar SOS;
 * desde desktop la barra ya no llega a la esquina. Tapa "Agregar gasto" hasta que se responde.
 */
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
    <section
      aria-label="Aviso de cookies"
      className={`fixed inset-x-4 z-30 ml-auto flex max-w-80 lg:right-10 flex-col gap-3 rounded-md trazo bg-papel-elevado p-3 shadow-dura lg:bottom-4 ${conBarra ? 'bottom-24' : 'bottom-4'}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="tema-claro grid size-8 shrink-0 place-items-center rounded-full trazo-fino bg-sol text-tinta">
          <Cookie size={16} strokeWidth={2} aria-hidden />
        </span>
        <p className="text-meta">Usamos cookies. Las necesarias para iniciar sesión funcionan siempre.</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => responder(aceptarCookies)}>
          Aceptar
        </Button>
        <Button variant="secundario" size="sm" className="flex-1" onClick={() => responder(rechazarCookies)}>
          Rechazar
        </Button>
      </div>
    </section>
  )
}
