import { useState, type ReactNode } from 'react'

type DespliegueProps = {
  abierta: boolean
  /** Para el aria-controls del botón que lo abre. */
  id: string
  children: ReactNode
}

function sinMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** El contenido de un menú desplegable: crece y se achica animando el alto. Cerrado, queda fuera del foco. */
export function Despliegue({ abierta, id, children }: DespliegueProps) {
  const [abiertaAntes, setAbiertaAntes] = useState(abierta)
  /* Mientras se mueve recorta lo que asoma; ya abierto, deja ver las sombras de lo que tiene adentro. */
  const [moviendose, setMoviendose] = useState(false)

  if (abierta !== abiertaAntes) {
    setAbiertaAntes(abierta)
    setMoviendose(!sinMovimiento())
  }

  return (
    <div
      id={id}
      inert={!abierta}
      data-abierta={abierta}
      className="despliegue"
      onTransitionEnd={(evento) => evento.target === evento.currentTarget && setMoviendose(false)}
    >
      <div className={`min-h-0 ${abierta && !moviendose ? '' : 'overflow-hidden'}`}>{children}</div>
    </div>
  )
}
