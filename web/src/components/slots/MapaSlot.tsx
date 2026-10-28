import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
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

function CentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.setView([lat, lng], mapa.getZoom())
  }, [lat, lng, mapa])
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
          <CentrarMapa lat={centroMapa.lat} lng={centroMapa.lng} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {centro && (
            <CircleMarker center={[centro.lat, centro.lng]} radius={10} pathOptions={{ color: '#1e293b', fillColor: '#f97316', fillOpacity: 0.9 }}>
              <Popup>{centro.nombre}</Popup>
            </CircleMarker>
          )}
          {puntos.map((punto) => (
            <CircleMarker key={punto.id} center={[punto.lat, punto.lng]} radius={7} pathOptions={{ color: '#1e293b', fillColor: '#38bdf8', fillOpacity: 0.9 }}>
              <Popup>{punto.nombre}</Popup>
            </CircleMarker>
          ))}
          {personas.map((persona) => (
            <CircleMarker key={persona.id} center={[persona.lat, persona.lng]} radius={6} pathOptions={{ color: '#1e293b', fillColor: '#a78bfa', fillOpacity: 0.9 }}>
              <Popup>{persona.nombre}</Popup>
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
