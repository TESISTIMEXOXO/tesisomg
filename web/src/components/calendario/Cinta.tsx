import { MapPin } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { TramoCalendario } from './tipos'
import { TONOS } from './utilidades'

type CintaProps = {
  tramo: TramoCalendario
  /** En celular: una franja sin texto. */
  fina?: boolean
  /** El destino empezó antes o sigue después de esta fila: ese borde queda abierto, como una cinta cortada. */
  sigueAntes?: boolean
  sigueDespues?: boolean
  style?: CSSProperties
}

/** Un destino del viaje cruzando los días en que se está ahí, como las cintas de destinos de la landing. */
export function Cinta({ tramo, fina = false, sigueAntes = false, sigueDespues = false, style }: CintaProps) {
  const bordes = `${sigueAntes ? 'rounded-l-none border-l-0' : 'ml-1'} ${sigueDespues ? 'rounded-r-none border-r-0' : 'mr-1'}`
  if (fina) {
    return <span aria-hidden className={`tema-claro my-0.5 h-2 rounded-full border-[1.5px] ${TONOS[tramo.tono].lleno} ${bordes}`} style={style} />
  }
  return (
    <span
      className={`tema-claro relative z-[1] my-0.5 flex min-w-0 items-center gap-1 rounded-full trazo-fino px-2.5 py-0.5 text-meta font-extrabold shadow-chica ${TONOS[tramo.tono].lleno} ${bordes}`}
      style={style}
    >
      <MapPin size={13} strokeWidth={2.5} aria-hidden className="flex-none" />
      <span className="truncate">{tramo.destino}</span>
    </span>
  )
}
