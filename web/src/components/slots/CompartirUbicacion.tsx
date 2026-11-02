import { useEffect, useState } from 'react'
import { useDejarDeCompartir, useEnviarUbicacion } from '../../hooks/ubicaciones'
import { Button } from '../ui/Button'

function posicionActual(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 15_000 },
    )
  })
}

export function CompartirUbicacion({ viajeId }: { viajeId: string }) {
  const enviar = useEnviarUbicacion(viajeId)
  const enviarUbicacion = enviar.mutateAsync
  const dejar = useDejarDeCompartir(viajeId)
  const [compartiendo, setCompartiendo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!compartiendo) return
    let activo = true
    const actualizar = async () => {
      try {
        const posicion = await posicionActual()
        if (activo) await enviarUbicacion(posicion)
        if (activo) setError('')
      } catch {
        if (activo) setError('No pudimos actualizar tu ubicación. Revisá el permiso del navegador y la conexión.')
      }
    }
    void actualizar()
    const temporizador = window.setInterval(() => void actualizar(), 30_000)
    return () => {
      activo = false
      window.clearInterval(temporizador)
    }
  }, [compartiendo, enviarUbicacion])

  async function cambiarCompartir() {
    setError('')
    if (compartiendo) {
      try {
        await dejar.mutateAsync()
        setCompartiendo(false)
      } catch {
        setError('No pudimos detener la ubicación compartida. Probá de nuevo.')
      }
      return
    }
    if (!('geolocation' in navigator)) {
      setError('Este navegador no permite compartir la ubicación.')
      return
    }
    try {
      await enviarUbicacion(await posicionActual())
      setCompartiendo(true)
    } catch (problema) {
      setError(problema instanceof GeolocationPositionError
        ? 'No tenemos permiso para acceder a tu ubicación. Habilitalo en el navegador e intentá de nuevo.'
        : 'No pudimos compartir tu ubicación. Revisá la conexión e intentá de nuevo.')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <Button
        type="button"
        variant={compartiendo ? 'secundario' : 'fantasma'}
        size="sm"
        disabled={enviar.isPending || dejar.isPending}
        onClick={() => void cambiarCompartir()}
      >
        {compartiendo ? 'Dejar de compartir ubicación' : 'Compartir mi ubicación'}
      </Button>
      <span className="text-meta text-tinta-suave">
        {compartiendo ? 'Visible solo para el grupo mientras dure el viaje.' : 'La ubicación se comparte solo si la activás.'}
      </span>
      {error && <p role="alert" className="w-full text-meta font-semibold text-negativo">{error}</p>}
    </div>
  )
}
