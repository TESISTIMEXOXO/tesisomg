import { divIcon } from 'leaflet'
import { useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Marker } from 'react-leaflet'
import { useEscalaMarcadores } from '../../hooks/escalaMarcadores'
import type { Ubicacion } from '../../types/itinerario'
import { tonoDePersona } from '../../pinz/tonos'
import { Pin } from '../marca/Pin'

const ANCHO_ICONO = 112
const ALTO_ETIQUETA = 24
const LADO_PIN = 56
// La punta del pin dentro de VIEWBOX_PINZ (-28 -26 176 176) cae en (60, 129): ese es el punto exacto de la ubicación.
const PUNTA_Y = Math.round(((129 + 26) / 176) * LADO_PIN)

/*
 * Leaflet pinta los marcadores fuera del árbol de React, así que el dibujo se pasa como HTML.
 * El prefijo de ids evita que el clipPath de un pinz choque con el de otro marcador.
 */
function iconoDe(persona: Ubicacion, indice: number, escala: number) {
  const html = renderToStaticMarkup(
    <span
      className="flex flex-col items-center font-texto"
      style={{ transform: `scale(${escala})`, transformOrigin: `50% ${PUNTA_Y}px` }}
    >
      <Pin pinz={persona.pinz ?? 'generico'} color={tonoDePersona(persona.pinz, indice)} size={LADO_PIN} label="" />
      <span className="-mt-0.5 max-w-full truncate rounded-full trazo-fino bg-papel-elevado px-2 text-meta font-extrabold text-tinta shadow-chica">
        {persona.nombre.split(' ')[0]}
      </span>
    </span>,
    { identifierPrefix: `persona-${persona.id}-` },
  )
  return divIcon({
    html,
    className: '',
    iconSize: [ANCHO_ICONO, LADO_PIN + ALTO_ETIQUETA],
    iconAnchor: [ANCHO_ICONO / 2, PUNTA_Y],
  })
}

function MarcadorPersona({ persona, indice, escala }: { persona: Ubicacion; indice: number; escala: number }) {
  const icono = useMemo(() => iconoDe(persona, indice, escala), [persona, indice, escala])
  return <Marker position={[persona.lat, persona.lng]} icon={icono} title={persona.nombre} alt={persona.nombre} />
}

/** Cada persona en el mapa: su pinz parado sobre donde está, con el nombre abajo. */
export function CapaPersonas({ personas }: { personas: Ubicacion[] }) {
  const escala = useEscalaMarcadores()
  return personas.map((persona, indice) => <MarcadorPersona key={persona.id} persona={persona} indice={indice} escala={escala} />)
}
