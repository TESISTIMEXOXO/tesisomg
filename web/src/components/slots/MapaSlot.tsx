import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { ELENCO } from '../../pinz/elenco'
import type { PuntoMapa, Ubicacion } from '../../types/itinerario'
import type { LugarViaje } from '../../types/viaje'
import { AvatarStack } from '../ui/AvatarStack'
import { EsperaSlot } from './EsperaSlot'

export type MapaSlotProps = {
  puntos: PuntoMapa[]
  personas: Ubicacion[]
  centro?: LugarViaje | null
  onSeleccionarPunto?: (id: string) => void
  alto?: 'chico' | 'grande'
  className?: string
}

const coloresPinz = {
  chispa: '#eab308',
  brujula: '#38bdf8',
  vuelto: '#fb923c',
  siesta: '#14b8a6',
  valija: '#f472b6',
  postal: '#a78bfa',
  nono: '#a8a29e',
  trasnoche: '#334155',
  morfi: '#eab308',
  cumbre: '#15803d',
}

function AjustarMapa({ centro, puntos }: { centro: LugarViaje | PuntoMapa; puntos: PuntoMapa[] }) {
  const mapa = useMap()
  useEffect(() => {
    const posiciones: [number, number][] = puntos.map((punto) => [punto.lat, punto.lng])
    posiciones.push([centro.lat, centro.lng])
    const unicas = posiciones.filter(
      ([lat, lng], indice, todas) => todas.findIndex(([otraLat, otroLng]) => lat === otraLat && lng === otroLng) === indice,
    )
    if (unicas.length > 1) mapa.fitBounds(unicas, { padding: [24, 24], maxZoom: 10 })
    else mapa.setView([centro.lat, centro.lng], 8)
  }, [centro.lat, centro.lng, mapa, puntos])
  return null
}

export function MapaSlot({ puntos, personas, centro, onSeleccionarPunto, alto = 'chico', className = '' }: MapaSlotProps) {
  const centroMapa = centro ?? puntos[0]
  return (
    <section
      aria-label="Mapa"
      className={`relative overflow-hidden rounded-lg trazo bg-cielo-tinte shadow-dura ${alto === 'chico' ? 'h-60' : 'h-90'} ${className}`}
    >
      {centroMapa ? (
        <MapContainer
          center={[centroMapa.lat, centroMapa.lng]}
          zoom={8}
          scrollWheelZoom={false}
          className="z-0 size-full"
          aria-label={`Mapa de ${centro?.nombre ?? 'destino del viaje'}`}
        >
          <AjustarMapa centro={centroMapa} puntos={puntos} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {centro && !puntos.some((punto) => punto.lat === centro.lat && punto.lng === centro.lng) && (
            <CircleMarker center={[centro.lat, centro.lng]} radius={10} pathOptions={{ color: '#1e293b', fillColor: '#f97316', fillOpacity: 0.9 }}>
              <Popup>{centro.nombre}</Popup>
            </CircleMarker>
          )}
          {puntos.map((punto) => (
            <CircleMarker
              key={punto.id}
              center={[punto.lat, punto.lng]}
              radius={7}
              pathOptions={{
                color: '#1e293b',
                fillColor: punto.tipo === 'actividad' ? '#38bdf8' : '#f97316',
                fillOpacity: 0.9,
              }}
            >
              <Popup>{punto.nombre}</Popup>
            </CircleMarker>
          ))}
          {personas.map((persona) => (
            <CircleMarker
              key={persona.id}
              center={[persona.lat, persona.lng]}
              radius={7}
              pathOptions={{
                color: '#1e293b',
                fillColor: persona.pinz ? coloresPinz[persona.pinz] : '#a78bfa',
                fillOpacity: 0.9,
              }}
            >
              <Popup>{persona.nombre}</Popup>
              <Tooltip permanent>{persona.pinz ? ELENCO[persona.pinz].nombre : persona.nombre}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <EsperaSlot titulo="Acá va el mapa">Elegí un destino para ver dónde queda el viaje.</EsperaSlot>
        </div>
      )}
      {personas.length > 0 && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-papel-elevado p-1 shadow-chica">
          <AvatarStack people={personas.map((persona) => ({ name: persona.nombre, pinz: persona.pinz }))} max={6} />
        </div>
      )}
      {puntos.length > 0 && onSeleccionarPunto && (
        <ul aria-label="Paradas" className="absolute inset-x-3 bottom-3 z-10 flex gap-2 overflow-x-auto">
          {puntos.map((punto) => (
            <li key={punto.id} className="flex-none">
              <button
                type="button"
                onClick={() => onSeleccionarPunto(punto.id)}
                className="min-h-toque rounded-full trazo-fino bg-papel-elevado px-3 text-meta font-extrabold shadow-chica"
              >
                {punto.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
