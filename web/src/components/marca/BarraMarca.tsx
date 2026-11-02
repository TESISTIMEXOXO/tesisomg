import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

/** La barra de afuera de la app: la marca queda en el mismo lugar, tenga o no algo al lado. */
export function BarraMarca({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <header className={`flex items-center justify-between gap-4 p-4 lg:px-12 lg:py-5.5 ${className}`}>
      <Link to="/" aria-label="Pinz, inicio" className="flex min-h-toque items-center rounded-sm">
        <Logo size={30} label="" className="lg:hidden" />
        <Logo size={40} label="" className="max-lg:hidden" />
      </Link>
      {children}
    </header>
  )
}
