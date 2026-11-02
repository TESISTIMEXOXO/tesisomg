import { useEffect, useState } from 'react'

export type Ubicacion =
  | { estado: 'buscando' }
  | { estado: 'ok'; lat: number; lng: number; precision: number }
  | { estado: 'denegada' }
  | { estado: 'no-disponible' }

/** La ubicación del teléfono en tiempo real: se actualiza mientras la pantalla está abierta. */
export function useUbicacionActual(): Ubicacion {
  const disponible = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [ubicacion, setUbicacion] = useState<Ubicacion>(disponible ? { estado: 'buscando' } : { estado: 'no-disponible' })

  useEffect(() => {
    if (!disponible) return
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => setUbicacion({ estado: 'ok', lat: coords.latitude, lng: coords.longitude, precision: coords.accuracy }),
      (error) => {
        // Si ya teníamos una posición, un corte de señal no la borra.
        setUbicacion((actual) =>
          actual.estado === 'ok' ? actual : { estado: error.code === error.PERMISSION_DENIED ? 'denegada' : 'no-disponible' },
        )
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [disponible])

  return ubicacion
}
