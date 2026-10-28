import { Link } from 'react-router-dom'
import { Logo } from '../../components/marca/Logo'
import { ButtonLink } from '../../components/ui/Button'

const SECCIONES = [
  { href: '#todo', label: 'Qué podés hacer' },
  { href: '#etapas', label: 'Cómo funciona' },
  { href: '#tu-pinz', label: 'Tu pinz' },
  { href: '#preguntas', label: 'Preguntas' },
]

export function BarraLanding() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 p-4 lg:px-12 lg:py-5.5">
      <Link to="/" aria-label="Pinz, inicio" className="rounded-sm">
        <Logo size={30} label="" className="lg:hidden" />
        <Logo size={40} label="" className="max-lg:hidden" />
      </Link>
      <nav aria-label="Secciones" className="hidden gap-7 font-extrabold lg:flex">
        {SECCIONES.map((seccion) => (
          <a key={seccion.href} href={seccion.href} className="rounded-sm hover:text-tinta-suave">
            {seccion.label}
          </a>
        ))}
      </nav>
      <div className="flex gap-3">
        <ButtonLink to="/ingresar" variant="secundario" size="sm">
          Ingresar
        </ButtonLink>
        <ButtonLink to="/ingresar" size="sm" className="max-lg:hidden">
          Armar un viaje
        </ButtonLink>
      </div>
    </header>
  )
}
