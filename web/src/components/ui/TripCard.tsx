import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ETAPAS } from '../../lib/etapa'
import { FONDO, FONDO_TINTE } from '../../pinz/tonos'
import type { Etapa } from '../../types/viaje'
import { Pin } from '../marca/Pin'
import { AvatarStack, type PersonaAvatar } from './AvatarStack'

type TripCardProps = {
  /** Nombre del viaje. */
  title: string
  place?: string
  /** Texto ya formateado: "14 – 21 ene 2027". */
  dates: string
  stage?: Etapa
  people?: PersonaAvatar[]
  /** URL de una foto del destino. Sin foto, la cabecera usa el tinte de la etapa. */
  image?: string
  /** Lo que falta, en una línea y con una acción concreta. */
  pending?: string | null
  /** A dónde lleva. Sin to, la card no es un link (por ejemplo, la vista previa al armar un viaje). */
  to?: string
  className?: string
}

export function TripCard({ title, place, dates, stage = 'previaje', people = [], image, pending, to, className = '' }: TripCardProps) {
  const { nombre, tono } = ETAPAS[stage]
  const base = `block overflow-hidden rounded-lg trazo bg-papel-elevado text-tinta shadow-grande ${className}`
  const contenido = (
    <>
      <div
        className={`relative flex min-h-38 flex-col items-start justify-between gap-4 trazo-b bg-cover bg-center p-4 ${image ? 'tema-claro' : FONDO_TINTE[tono]}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        {image && <span aria-hidden className="absolute inset-x-0 top-1/2 bottom-0 bg-contorno/50" />}
        <span className={`relative rounded-full trazo-fino px-2.5 py-0.5 text-sobretitulo uppercase tema-claro ${FONDO[tono]}`}>{nombre}</span>
        {place && (
          <span className={`relative pr-20 font-display text-titulo-1 font-black ${image ? 'text-papel' : 'text-tinta'}`}>
            {place}
          </span>
        )}
        {!image && <Pin size={72} color={tono} label="" className="absolute right-3.5 bottom-2.5 rotate-10" />}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-titulo-2">{title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-meta text-tinta-suave">
            <Calendar size={16} strokeWidth={2} aria-hidden />
            {dates}
          </p>
        </div>
        <AvatarStack people={people} max={3} />
      </div>
      {pending && (
        <p className="flex items-center gap-2 border-t-2 border-dashed bg-sol-tinte px-4 py-3 text-etiqueta">
          <span aria-hidden className="size-2.5 flex-none rounded-full border-2 bg-sol" />
          {pending}
        </p>
      )}
    </>
  )

  if (!to) return <article className={base}>{contenido}</article>
  return (
    <Link
      to={to}
      className={`${base} transition-[translate] duration-150 ease-rebote hover:-translate-0.5 motion-reduce:transition-none motion-reduce:hover:translate-0`}
    >
      {contenido}
    </Link>
  )
}
