import { useSyncExternalStore } from 'react'
import { BarraMarca } from '../../components/marca/BarraMarca'
import { ButtonLink } from '../../components/ui/Button'

const SECCIONES = [
  { href: '#todo', label: 'Qué podés hacer' },
  { href: '#etapas', label: 'Cómo funciona' },
  { href: '#tu-pinz', label: 'Tu pinz' },
  { href: '#preguntas', label: 'Preguntas' },
]

function suscribirAlScroll(avisar: () => void) {
  window.addEventListener('scroll', avisar, { passive: true })
  return () => window.removeEventListener('scroll', avisar)
}

const hayScroll = () => window.scrollY > 0

export function BarraLanding() {
  const conFondo = useSyncExternalStore(suscribirAlScroll, hayScroll)

  /* Arriba de todo va transparente: el camino del hero pasa por detrás de los botones y un fondo lo taparía. */
  return (
    <BarraMarca
      className={`sticky top-0 z-30 border-b-2 motion-safe:transition-colors ${conFondo ? 'border-contorno bg-papel' : 'border-transparent'}`}
    >
      <nav aria-label="Secciones" className="hidden gap-7 font-extrabold lg:flex">
        {SECCIONES.map((seccion) => (
          <a key={seccion.href} href={seccion.href} className="rounded-sm hover:text-tinta-suave">
            {seccion.label}
          </a>
        ))}
      </nav>
      <div data-camino="acceso" className="flex gap-3">
        <ButtonLink to="/ingresar?paso=ingreso" variant="secundario" size="sm">
          Iniciar sesión
        </ButtonLink>
        <ButtonLink to="/ingresar" size="sm" className="max-lg:hidden">
          Registrarse
        </ButtonLink>
      </div>
    </BarraMarca>
  )
}
