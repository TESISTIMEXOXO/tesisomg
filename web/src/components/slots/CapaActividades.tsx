import { divIcon } from 'leaflet'
import { useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Marker } from 'react-leaflet'
import { useEscalaMarcadores } from '../../hooks/escalaMarcadores'
import type { ParadaMapa } from '../../lib/paradas'
import { SILUETA } from '../../pinz/dibujos'
import { PopupMapa } from './PopupMapa'

const ANCHO = 36
const ALTO = 39
// La punta de SILUETA cae en (60, 129) dentro del viewBox -4 -4 140 150: ese es el punto exacto de la actividad.
const PUNTA_X = Math.round(((60 + 4) / 140) * ANCHO)
const PUNTA_Y = Math.round(((129 + 4) / 150) * ALTO)
/* Centro de la cabeza dentro de SILUETA: el número va ahí y no en el centro de la caja, que incluye la punta. */
const CABEZA = { x: 60, y: 54 }

function iconoDe(orden: number, escala: number) {
  const proxima = orden === 1
  const html = renderToStaticMarkup(
    <svg
      viewBox="-4 -4 140 150"
      width={ANCHO}
      height={ALTO}
      className="tema-claro block overflow-visible"
      style={{ transform: `scale(${escala})`, transformOrigin: `${PUNTA_X}px ${PUNTA_Y}px` }}
    >
      <path d={SILUETA} transform="translate(6 6)" strokeWidth={9} strokeLinejoin="round" className="fill-tinta stroke-tinta" />
      <path
        d={SILUETA}
        strokeWidth={9}
        strokeLinejoin="round"
        className={`stroke-tinta ${proxima ? 'fill-coral' : 'fill-papel-elevado'}`}
      />
      <text
        x={CABEZA.x}
        y={CABEZA.y}
        dy="0.35em"
        textAnchor="middle"
        fontSize={orden > 9 ? 44 : 56}
        className="fill-tinta font-display font-black"
      >
        {orden}
      </text>
    </svg>,
  )
  return divIcon({ html, className: '', iconSize: [ANCHO, ALTO], iconAnchor: [PUNTA_X, PUNTA_Y] })
}

function MarcadorActividad({ parada, orden, escala }: { parada: ParadaMapa; orden: number; escala: number }) {
  const icono = useMemo(() => iconoDe(orden, escala), [orden, escala])
  return (
    <Marker
      position={[parada.lat, parada.lng]}
      icon={icono}
      title={`${orden}. ${parada.nombre}`}
      alt={`${orden}. ${parada.nombre}`}
      // Debajo de las personas, y entre actividades la más próxima arriba.
      zIndexOffset={-1000 * orden}
    >
      <PopupMapa>{parada.nombre}</PopupMapa>
    </Marker>
  )
}

/** Las actividades que faltan, como pins numerados: el 1 es la más próxima y va en coral. */
export function CapaActividades({ paradas }: { paradas: ParadaMapa[] }) {
  const escala = useEscalaMarcadores()
  return paradas.flatMap((parada) =>
    parada.orden === undefined ? [] : [<MarcadorActividad key={parada.id} parada={parada} orden={parada.orden} escala={escala} />],
  )
}
