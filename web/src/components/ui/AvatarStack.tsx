import { SILUETA } from '../../pinz/dibujos'
import type { PinzId } from '../../pinz/elenco'
import { RELLENO_SVG, tonoDePersona } from '../../pinz/tonos'

export type PersonaAvatar = string | { name: string; pinz?: PinzId | null }

type AvatarStackProps = {
  people: PersonaAvatar[]
  /** Cuántos se muestran antes de resumir el resto en "+N". */
  max?: number
  className?: string
}

function nombreDe(persona: PersonaAvatar) {
  return typeof persona === 'string' ? persona : persona.name
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/* Centro de la cabeza dentro de SILUETA: la inicial va ahí y no en el centro de la caja, que incluye la punta. */
const CABEZA = { x: 60, y: 54 }

function Avatar({ texto, relleno, className = '-ml-2 h-10 w-9 first:ml-0' }: { texto: string; relleno: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="-4 -4 140 150" className={`tema-claro block flex-none overflow-visible ${className}`}>
      <path d={SILUETA} transform="translate(6 6)" strokeWidth={9} strokeLinejoin="round" className="fill-tinta stroke-tinta" />
      <path d={SILUETA} strokeWidth={9} strokeLinejoin="round" className={`stroke-tinta ${relleno}`} />
      {/* dy de media altura de mayúscula: centra la letra en vista sin depender de cómo cada navegador resuelve dominant-baseline. */}
      <text
        x={CABEZA.x}
        y={CABEZA.y}
        dy="0.35em"
        textAnchor="middle"
        fontSize={texto.length > 2 ? 34 : 46}
        className="fill-tinta font-texto font-extrabold"
      >
        {texto}
      </text>
    </svg>
  )
}

/** Una sola persona, suelta: para meterla dentro de un botón. Decorativa: el nombre lo pone quien la usa. */
export function AvatarPersona({ nombre, pinz, indice, className }: { nombre: string; pinz?: PinzId | null; indice: number; className?: string }) {
  return <Avatar texto={iniciales(nombre)} relleno={RELLENO_SVG[tonoDePersona(pinz, indice)]} className={className} />
}

/** Cada persona es la silueta de un pin con su inicial, en el tono de su pinz. Nunca con cara. */
export function AvatarStack({ people, max = 4, className = '' }: AvatarStackProps) {
  const visibles = people.slice(0, max)
  const resto = people.length - visibles.length
  const nombres = people.map(nombreDe)
  return (
    <span
      role="img"
      aria-label={people.length === 1 ? nombres[0] : `${people.length} personas: ${nombres.join(', ')}`}
      className={`inline-flex items-end pl-1.5 ${className}`}
    >
      {visibles.map((persona, i) => {
        const pinz = typeof persona === 'string' ? null : persona.pinz
        return <Avatar key={`${nombreDe(persona)}-${i}`} texto={iniciales(nombreDe(persona))} relleno={RELLENO_SVG[tonoDePersona(pinz, i)]} />
      })}
      {resto > 0 && <Avatar texto={`+${resto}`} relleno="fill-papel-elevado" />}
    </span>
  )
}
