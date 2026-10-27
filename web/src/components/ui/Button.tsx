import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { estilosBoton, type TamanoBoton, type VarianteBoton } from './estilosBoton'

type Apariencia = {
  /** Un solo primario por pantalla; si hay otra acción, secundario; las terciarias, fantasma. */
  variant?: VarianteBoton
  /** md = 50px, sm = 44px. */
  size?: TamanoBoton
  icon?: LucideIcon
  iconRight?: LucideIcon
  /** Ancho completo: el primario al final de un formulario en mobile. */
  full?: boolean
  children?: ReactNode
}

type ButtonProps = Apariencia & ButtonHTMLAttributes<HTMLButtonElement>

function Contenido({ icon: Icono, iconRight: IconoDerecha, children }: Pick<Apariencia, 'icon' | 'iconRight' | 'children'>) {
  return (
    <>
      {Icono && <Icono size={20} strokeWidth={2} aria-hidden />}
      {children && <span>{children}</span>}
      {IconoDerecha && <IconoDerecha size={20} strokeWidth={2} aria-hidden />}
    </>
  )
}

export function Button({ variant, size, icon, iconRight, full, className = '', children, type = 'button', ...resto }: ButtonProps) {
  return (
    <button type={type} className={`${estilosBoton(variant, size, full)} ${className}`} {...resto}>
      <Contenido icon={icon} iconRight={iconRight}>
        {children}
      </Contenido>
    </button>
  )
}

/** Un link de la app que se ve como botón ("Armar un viaje", "Volver a Mis viajes"). */
export function ButtonLink({ variant, size, icon, iconRight, full, className = '', children, ...resto }: Apariencia & LinkProps) {
  return (
    <Link className={`${estilosBoton(variant, size, full)} ${className}`} {...resto}>
      <Contenido icon={icon} iconRight={iconRight}>
        {children}
      </Contenido>
    </Link>
  )
}
