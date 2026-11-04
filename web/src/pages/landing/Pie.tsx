import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconoInstagram } from '../../components/marca/IconoInstagram'
import { Logo } from '../../components/marca/Logo'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { BotonMail } from './BotonMail'
import { FormularioContacto } from './FormularioContacto'

const INSTAGRAM = 'https://www.instagram.com/pinz.app/'

const estiloLink =
  'inline-flex min-h-11 items-center rounded-sm font-bold underline decoration-2 underline-offset-4 hover:text-tinta-suave lg:min-h-0'

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 lg:gap-3">
      <h2 className="text-meta font-extrabold text-tinta-suave">{titulo}</h2>
      <ul className="flex flex-col lg:gap-2">{children}</ul>
    </div>
  )
}

export function Pie() {
  return (
    <footer className="relative z-10 px-4 pt-9 pb-11 md:px-6 lg:pt-14 lg:pb-16">
      <div className="mx-auto flex max-w-contenido flex-col gap-8 lg:gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <Logo size={64} className="lg:hidden" />
          <Logo size={120} className="max-lg:hidden" />
          <nav aria-label="Pie" className="grid grid-cols-2 gap-6 text-etiqueta lg:gap-20 lg:text-cuerpo">
            <Grupo titulo="Pinz">
              <li><a href="#todo" className={estiloLink}>Qué podés hacer</a></li>
              <li><a href="#etapas" className={estiloLink}>Cómo funciona</a></li>
              <li><a href="#tu-pinz" className={estiloLink}>Tu pinz</a></li>
              <li><a href="#preguntas" className={estiloLink}>Preguntas</a></li>
            </Grupo>
            <Grupo titulo="Sumate">
              <li><Link to="/test" className={estiloLink}>Hacé el test</Link></li>
              <li><Link to="/ingresar?paso=ingreso" className={estiloLink}>Iniciá sesión</Link></li>
              <li><FormularioContacto comoLink={estiloLink} /></li>
            </Grupo>
          </nav>
        </div>
        <div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-contorno pt-5">
          <p className="text-meta font-bold lg:text-cuerpo">Hecho en Argentina · © {new Date().getFullYear()} Pinz</p>
          <div className="flex items-center gap-2">
            <BotonMail />
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Pinz (se abre en otra pestaña)"
              className={estilosBoton('secundario', 'icono')}
            >
              <IconoInstagram />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
