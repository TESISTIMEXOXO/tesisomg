import { Link } from 'react-router-dom'
import { Logo } from '../../components/marca/Logo'
import { ButtonLink } from '../../components/ui/Button'

const SECCIONES = [
  { href: '#como', label: 'Cómo funciona' },
  { href: '#funciones', label: 'Qué podés hacer' },
  { href: '#tu-pinz', label: 'Tu pinz' },
  { href: '#preguntas', label: 'Preguntas' },
]

export function BarraLanding() {
  return (
    <header className="sticky top-0 z-30 trazo-grueso-b bg-papel">
      <div className="mx-auto flex max-w-310 items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Link to="/" aria-label="Pinz, inicio" className="rounded-sm">
          <Logo size={34} label="" />
        </Link>
        <nav aria-label="Secciones" className="hidden gap-6 font-extrabold lg:flex">
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
          <div className="hidden md:block">
            <ButtonLink to="/ingresar" size="sm">
              Armar un viaje
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  )
}
