import { useEffect, useState, type MouseEvent } from 'react'
import { Mail } from 'lucide-react'
import { estilosBoton } from '../../components/ui/estilosBoton'

const MAIL = 'pinz.tesis@gmail.com'
const DURACION_GLOBO = 1800

/**
 * En el celu abre la app de mail. En la compu muchas veces no hay ninguna configurada
 * y el mailto no hace nada, así que ahí copia la dirección.
 */
export function BotonMail() {
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!copiado) return
    const timer = window.setTimeout(() => setCopiado(false), DURACION_GLOBO)
    return () => window.clearTimeout(timer)
  }, [copiado])

  async function copiar(evento: MouseEvent<HTMLAnchorElement>) {
    if (!window.matchMedia('(pointer: fine)').matches) return
    evento.preventDefault()
    try {
      await navigator.clipboard.writeText(MAIL)
      setCopiado(false)
      requestAnimationFrame(() => setCopiado(true))
    } catch {
      window.location.href = `mailto:${MAIL}`
    }
  }

  return (
    <div className="relative">
      <a
        href={`mailto:${MAIL}`}
        onClick={copiar}
        aria-label={`Mail de Pinz: ${MAIL}`}
        className={estilosBoton('secundario', 'icono')}
      >
        <Mail size={20} aria-hidden />
      </a>
      {copiado && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-full mb-2 rounded-full bg-tinta px-3 py-1 text-meta font-bold whitespace-nowrap text-papel shadow-chica motion-safe:animate-copiado"
        >
          ¡Mail copiado!
        </span>
      )}
      <span role="status" className="sr-only">
        {copiado ? `Copiaste ${MAIL}` : ''}
      </span>
    </div>
  )
}
