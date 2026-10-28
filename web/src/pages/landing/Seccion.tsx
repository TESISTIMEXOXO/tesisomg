import type { ReactNode } from 'react'

type SeccionProps = {
  id?: string
  className?: string
  children: ReactNode
  'aria-label'?: string
}

/** Una sección de la landing: sin fondo propio (el papel es continuo) y por encima del camino. */
export function Seccion({ id, className = '', children, ...resto }: SeccionProps) {
  return (
    <section id={id} className="relative z-10 scroll-mt-6 px-4 md:px-6" {...resto}>
      <div className={`mx-auto max-w-contenido ${className}`}>{children}</div>
    </section>
  )
}

/**
 * El espacio vacío entre dos secciones por donde cruza el camino.
 * Su borde de arriba es el ancla de ese tramo (data-camino), así que no lleva contenido.
 */
export function Pausa({ ancla, className = 'h-37.5 lg:h-60' }: { ancla: string; className?: string }) {
  return <div aria-hidden data-camino={ancla} className={className} />
}

export function Titular({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-titular text-balance ${className}`}>{children}</h2>
}

export function Bajada({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-105 text-cuerpo-lg font-semibold text-pretty lg:text-bajada ${className}`}>{children}</p>
}

export function Sobretitulo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sobretitulo uppercase ${className}`}>{children}</p>
}

/** La tarjeta grande de la landing: contorno grueso, radio grande y sombra dura. */
export const TARJETA = 'rounded-lg trazo-grueso shadow-grande'
