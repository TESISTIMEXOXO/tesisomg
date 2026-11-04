import { MapPin } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useDejarDeCompartir, useEnviarUbicacion } from '../../hooks/ubicaciones'

function posicionActual(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 15_000 },
    )
  })
}

/**
 * El botón de la barra de arriba, solo en etapa Viaje: comparte tu ubicación con el grupo cada 30 segundos
 * hasta que lo apagás. En mobile es solo el ícono; prendido, se pinta del color de la etapa y late.
 */
export function CompartirUbicacion({ viajeId }: { viajeId: string }) {
  const enviar = useEnviarUbicacion(viajeId)
  const enviarUbicacion = enviar.mutateAsync
  const dejar = useDejarDeCompartir(viajeId)
  const [compartiendo, setCompartiendo] = useState(false)
  const [error, setError] = useState('')
  const idAyuda = useId()

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

  const ayuda = compartiendo ? 'Visible solo para el grupo mientras dure el viaje.' : 'La ubicación se comparte solo si la activás.'

  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={compartiendo}
        aria-describedby={idAyuda}
        title={ayuda}
        disabled={enviar.isPending || dejar.isPending}
        onClick={() => void cambiarCompartir()}
        className={`relative inline-flex min-h-toque items-center justify-center gap-2 rounded-full trazo px-4 max-md:size-11 max-md:gap-0 max-md:px-0 text-etiqueta shadow-chica transition-[translate,box-shadow] duration-120 ease-rebote hover:-translate-px hover:shadow-dura disabled:cursor-wait motion-reduce:transition-none ${
          compartiendo ? 'tema-claro bg-mar text-tinta' : 'bg-papel-elevado text-tinta'
        }`}
      >
        <MapPin size={20} strokeWidth={2} aria-hidden />
        <span className="max-md:sr-only">{compartiendo ? 'Compartiendo ubicación' : 'Compartir ubicación'}</span>
        {compartiendo && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 grid size-3">
            <span className="absolute inset-0 rounded-full bg-positivo motion-safe:animate-ping" />
            <span className="relative rounded-full trazo-fino bg-positivo" />
          </span>
        )}
      </button>
      <span id={idAyuda} className="sr-only">
        {ayuda}
      </span>
      {error && (
        <p
          role="alert"
          className="absolute top-full right-0 z-30 mt-2 w-64 rounded-md trazo bg-papel-elevado p-3 text-meta font-semibold text-negativo shadow-dura"
        >
          {error}
        </p>
      )}
    </div>
  )
}
