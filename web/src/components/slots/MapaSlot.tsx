import type { Map as MapaLeaflet } from 'leaflet'
import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { ParadaMapa } from '../../lib/paradas'
import type { PuntoMapa, Ubicacion } from '../../types/itinerario'
import type { LugarViaje } from '../../types/viaje'
import { AvatarPersona } from '../ui/AvatarStack'
import { CapaActividades } from './CapaActividades'
import { CapaPersonas } from './CapaPersonas'
import { PopupMapa } from './PopupMapa'
import { EsperaSlot } from './EsperaSlot'

export type MapaSlotProps = {
  /** Las actividades solo se dibujan si traen `orden` (ver numerarParadas): las que ya pasaron no van. */
  puntos: ParadaMapa[]
  personas: Ubicacion[]
  centro?: LugarViaje | null
  onSeleccionarPunto?: (id: string) => void
  alto?: 'chico' | 'grande'
  className?: string
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

const ZOOM_PERSONA = 14

function irA(mapa: MapaLeaflet, { lat, lng }: Ubicacion) {
  const zoom = Math.max(mapa.getZoom(), ZOOM_PERSONA)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) mapa.setView([lat, lng], zoom)
  else mapa.flyTo([lat, lng], zoom, { duration: 0.8 })
}

export function MapaSlot({ puntos, personas, centro, onSeleccionarPunto, alto = 'chico', className = '' }: MapaSlotProps) {
  const centroMapa = centro ?? puntos[0]
  const [mapa, setMapa] = useState<MapaLeaflet | null>(null)
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
          ref={setMapa}
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
              <PopupMapa>{centro.nombre}</PopupMapa>
            </CircleMarker>
          )}
          {puntos.filter((punto) => punto.tipo !== 'actividad').map((punto) => (
            <CircleMarker
              key={punto.id}
              center={[punto.lat, punto.lng]}
              radius={7}
              pathOptions={{
                color: '#1e293b',
                fillColor: '#f97316',
                fillOpacity: 0.9,
              }}
            >
              <PopupMapa>{punto.nombre}</PopupMapa>
            </CircleMarker>
          ))}
          <CapaActividades paradas={puntos} />
          <CapaPersonas personas={personas} />
        </MapContainer>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <EsperaSlot titulo="Acá va el mapa">Elegí un destino para ver dónde queda el viaje.</EsperaSlot>
        </div>
      )}
      {personas.length > 0 && mapa && (
        // Deja libre la izquierda para los botones de zoom de Leaflet; con mucha gente, la fila se desliza.
        <div className="pointer-events-none absolute left-16 right-3 top-3 z-10 flex justify-end">
          <ul
            aria-label="Ir a la ubicación de"
            className="pointer-events-auto flex overflow-x-auto rounded-full trazo-fino bg-papel-elevado p-0.5 shadow-chica"
          >
            {personas.map((persona, indice) => (
              <li key={persona.id} className="flex-none">
                <button
                  type="button"
                  onClick={() => irA(mapa, persona)}
                  aria-label={`Ver dónde está ${persona.nombre}`}
                  title={persona.nombre}
                  className="grid size-toque place-items-center rounded-full transition-colors hover:bg-papel motion-reduce:transition-none"
                >
                  <AvatarPersona nombre={persona.nombre} pinz={persona.pinz} indice={indice} className="h-9 w-8" />
                </button>
              </li>
            ))}
          </ul>
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
