import { SILUETA } from '../../pinz/dibujos'
import { ELENCO, type PinzId, type TonoPinz } from '../../pinz/elenco'
import { RELLENO_SVG } from '../../pinz/tonos'

export type PersonaAvatar = string | { name: string; pinz?: PinzId | null }

type AvatarStackProps = {
  people: PersonaAvatar[]
  /** Cuántos se muestran antes de resumir el resto en "+N". */
  max?: number
  className?: string
}

/* Sin pinz elegido, los tonos rotan y no significan nada. */
const TONOS_SIN_PINZ: TonoPinz[] = ['sol', 'mar', 'lavanda', 'coral']

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

function Avatar({ texto, relleno }: { texto: string; relleno: string }) {
  return (
    <svg aria-hidden viewBox="-4 -4 140 150" className="tema-claro -ml-2 block h-10 w-9 flex-none overflow-visible first:ml-0">
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
        const tono = pinz ? ELENCO[pinz].tono : TONOS_SIN_PINZ[i % TONOS_SIN_PINZ.length]
        return <Avatar key={`${nombreDe(persona)}-${i}`} texto={iniciales(nombreDe(persona))} relleno={RELLENO_SVG[tono]} />
      })}
      {resto > 0 && <Avatar texto={`+${resto}`} relleno="fill-papel-elevado" />}
    </span>
  )
}
