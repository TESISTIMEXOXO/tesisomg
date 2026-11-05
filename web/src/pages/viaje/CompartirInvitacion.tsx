import { Check, Copy, MessageCircle, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { estilosBoton } from '../../components/ui/estilosBoton'

type Props = {
  link: string
  codigo: string
  viaje: { nombre: string; destino: string }
}

/**
 * Las formas de pasar la invitación además del QR: copiar el link, mandarlo directo por WhatsApp y,
 * donde el navegador lo permite (casi todos los teléfonos), el menú de compartir del sistema.
 */
export function CompartirInvitacion({ link, codigo, viaje }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState('')
  // El link va solo en su renglón: pegado a otra palabra o a un signo, WhatsApp puede no reconocerlo como link.
  const mensaje = `¡Sumate a ${viaje.nombre} (${viaje.destino}) en Pinz!\n\nEntrá con este link:\n${link}\n\nO usá el código ${codigo}`
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copiar() {
    setError('')
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setError('No pudimos copiar el link. Seleccionalo y copialo a mano.')
    }
  }

  async function compartir() {
    setError('')
    try {
      await navigator.share({ title: `Unite a ${viaje.nombre}`, text: mensaje })
    } catch (problema) {
      // Cerrar el menú sin elegir nada no es un error.
      if (problema instanceof DOMException && problema.name === 'AbortError') return
      setError('No pudimos abrir el menú de compartir. Copiá el link o mandalo por WhatsApp.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-meta break-all text-tinta-suave select-all">{link}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secundario" size="sm" icon={copiado ? Check : Copy} onClick={() => void copiar()}>
          {copiado ? 'Link copiado' : 'Copiar el link'}
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={estilosBoton('secundario', 'sm')}
        >
          <MessageCircle size={20} strokeWidth={2} aria-hidden />
          <span>Enviar por WhatsApp</span>
        </a>
        {puedeCompartir && (
          <Button variant="secundario" size="sm" icon={Share2} onClick={() => void compartir()}>
            Compartir
          </Button>
        )}
      </div>
      <span role="status" className="sr-only">
        {copiado ? 'Link copiado' : ''}
      </span>
      {error && (
        <p role="alert" className="text-meta font-semibold text-negativo">
          {error}
        </p>
      )}
    </div>
  )
}
