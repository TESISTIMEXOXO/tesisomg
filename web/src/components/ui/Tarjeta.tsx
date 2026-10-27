import type { ReactNode } from 'react'

type TarjetaProps = {
  /** Título de la card, en titulo-2 display. */
  titulo?: string
  /** Algo a la derecha del título: un badge, un número, una acción chica. */
  extra?: ReactNode
  /** Fondo de la card: papel-elevado por defecto o el tinte de una sección. */
  fondo?: string
  className?: string
  children: ReactNode
}

/** El bloque de contenido de la app: contorno tinta, radio grande y sombra dura. */
export function Tarjeta({ titulo, extra, fondo = 'bg-papel-elevado', className = '', children }: TarjetaProps) {
  return (
    <section className={`flex flex-col gap-3 rounded-lg trazo p-4 shadow-grande md:p-6 ${fondo} ${className}`}>
      {(titulo || extra) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {titulo && <h2 className="font-display text-titulo-1 font-black">{titulo}</h2>}
          {extra}
        </div>
      )}
      {children}
    </section>
  )
}

/** Un badge chico de texto, como "Cierra el viernes". */
export function Etiqueta({ children, fondo = 'bg-sol-tinte' }: { children: ReactNode; fondo?: string }) {
  return <span className={`rounded-full trazo-fino px-2.5 py-1 text-meta font-extrabold ${fondo}`}>{children}</span>
}
