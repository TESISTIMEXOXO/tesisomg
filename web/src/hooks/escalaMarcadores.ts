import { useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

/*
 * Los íconos de Leaflet miden lo mismo en pantalla a cualquier zoom, así que al alejar el mapa
 * taparían todo. Los marcadores se achican con el zoom, siempre desde la punta.
 */
function escalaSegunZoom(zoom: number) {
  if (zoom >= 12) return 1
  if (zoom >= 9) return 0.8
  if (zoom >= 7) return 0.65
  return 0.55
}

/** La escala de los marcadores para el zoom actual. Solo dentro de un MapContainer. */
export function useEscalaMarcadores() {
  const mapa = useMap()
  const [zoom, setZoom] = useState(() => mapa.getZoom())
  useMapEvents({ zoomend: () => setZoom(mapa.getZoom()) })
  return escalaSegunZoom(zoom)
}
