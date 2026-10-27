import type { ReactNode } from 'react'

type BandaProps = {
  id?: string
  /** Fondo de borde a borde: cada banda es un color plano o papel. */
  fondo?: string
  /** Para bandas de lectura, como las preguntas. */
  angosta?: boolean
  className?: string
  children: ReactNode
  'aria-label'?: string
}

/** Una banda de la landing: separada de la anterior por el trazo grueso y con el ancho de la marca. */
export function Banda({ id, fondo = 'bg-papel', angosta = false, className = '', children, ...resto }: BandaProps) {
  return (
    <section id={id} className={`scroll-mt-20 trazo-grueso-t ${fondo}`} {...resto}>
      <div className={`mx-auto ${angosta ? 'max-w-225' : 'max-w-310'} px-4 py-20 md:px-6 lg:py-22 ${className}`}>{children}</div>
    </section>
  )
}

export function Sobretitulo({ children }: { children: ReactNode }) {
  return <p className="text-sobretitulo uppercase">{children}</p>
}

export function TituloBanda({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-display font-black text-balance lg:text-display-xl ${className}`}>{children}</h2>
}

export function Bajada({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-120 text-cuerpo-lg font-semibold ${className}`}>{children}</p>
}
