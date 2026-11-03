import type { PinzId } from '../../pinz/elenco'
import { Pin } from './Pin'

type TituloPantallaProps = {
  titulo: string
  /** El pinz de la sección. Sin pinz en las pantallas que no llevan uno. */
  pinz?: PinzId
}

/** El título de cada sección del viaje, con su pinz al lado. */
export function TituloPantalla({ titulo, pinz }: TituloPantallaProps) {
  return (
    <div className="mb-8 flex items-center gap-3">
      {pinz && <Pin pinz={pinz} size={52} label="" />}
      <h2 className="font-display text-titulo-1 font-black lg:text-display">{titulo}</h2>
    </div>
  )
}
