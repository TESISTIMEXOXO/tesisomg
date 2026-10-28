import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { TextField } from '../../components/ui/TextField'
import { TripCard } from '../../components/ui/TripCard'
import { useBuscarLugares, useCrearViaje } from '../../hooks/viajes'
import { rangoDeFechas } from '../../lib/fechas'
import { NuevoViajeSchema } from '../../types/viaje'
import type { SugerenciaLugar } from '../../types/viaje'

type Errores = Partial<Record<'nombre' | 'destino' | 'fechaVuelta', string>>

/** HU-04: armar un viaje con destino y fechas, o sin fechas todavía. */
export function NuevoViaje() {
  const navigate = useNavigate()
  const crear = useCrearViaje()
  const [nombre, setNombre] = useState('')
  const [destino, setDestino] = useState('')
  const [ubicacion, setUbicacion] = useState<SugerenciaLugar | null>(null)
  const [consulta, setConsulta] = useState('')
  const [fechaIda, setFechaIda] = useState('')
  const [fechaVuelta, setFechaVuelta] = useState('')
  const [sinFechas, setSinFechas] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const sugerencias = useBuscarLugares(consulta)

  useEffect(() => {
    const texto = destino.trim()
    const temporizador = window.setTimeout(
      () => setConsulta(texto.length >= 3 && ubicacion?.nombre !== destino ? texto : ''),
      450,
    )
    return () => window.clearTimeout(temporizador)
  }, [destino, ubicacion])

  const datos = {
    nombre,
    destino: ubicacion?.nombre ?? destino,
    ubicacion: ubicacion ? { nombre: ubicacion.nombre, lat: ubicacion.lat, lng: ubicacion.lng } : null,
    fechaIda: sinFechas || !fechaIda ? null : fechaIda,
    fechaVuelta: sinFechas || !fechaVuelta ? null : fechaVuelta,
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = NuevoViajeSchema.safeParse(datos)
    if (!resultado.success) {
      const nuevos: Errores = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof Errores
        nuevos[campo] ??= issue.message
      }
      setErrores(nuevos)
      return
    }
    if (!resultado.data.ubicacion) {
      setErrores({ destino: 'Elegí una ubicación de la lista para mostrarla en el mapa.' })
      return
    }
    setErrores({})
    crear.mutate(resultado.data, { onSuccess: () => navigate('/viajes') })
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      <form onSubmit={enviar} noValidate className="flex flex-1 flex-col gap-6 lg:max-w-140">
        <h1 className="font-display text-display font-black">Armar un viaje</h1>
        <TextField
          label="¿A dónde van?"
          placeholder="Bariloche"
          value={destino}
          error={errores.destino}
          onChange={(evento) => {
            setDestino(evento.target.value)
            setUbicacion(null)
          }}
        />
        {consulta && (
          <div className="-mt-4 rounded-md trazo bg-papel-elevado p-2" role="listbox" aria-label="Lugares sugeridos">
            {sugerencias.isPending && <p className="p-3 text-meta text-tinta-suave">Buscando lugares…</p>}
            {sugerencias.error && <p role="alert" className="p-3 text-meta text-negativo">No pudimos buscar lugares. Revisá la conexión y probá de nuevo.</p>}
            {sugerencias.data?.map((lugar) => (
              <button
                key={lugar.id}
                type="button"
                role="option"
                aria-selected={ubicacion?.id === lugar.id}
                onClick={() => {
                  setDestino(lugar.nombre)
                  setUbicacion(lugar)
                  setConsulta('')
                  setErrores((actuales) => ({ ...actuales, destino: undefined }))
                }}
                className="flex min-h-toque w-full flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-papel-hundido"
              >
                <span className="font-bold">{lugar.nombre}</span>
                <span className="text-meta text-tinta-suave">{lugar.detalle}</span>
              </button>
            ))}
            {sugerencias.data?.length === 0 && <p className="p-3 text-meta text-tinta-suave">No encontramos lugares con ese nombre.</p>}
          </div>
        )}
        <TextField
          label="¿Cómo se llama el viaje?"
          hint="Como lo nombrarían en el grupo."
          placeholder="Bariloche con los chicos"
          value={nombre}
          error={errores.nombre}
          onChange={(evento) => setNombre(evento.target.value)}
        />
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-etiqueta">Fechas</legend>
          {!sinFechas && (
            <div className="grid gap-4 md:grid-cols-2">
              <CampoFecha label="Ida" value={fechaIda} onChange={setFechaIda} />
              <CampoFecha
                label="Vuelta"
                min={fechaIda || undefined}
                value={fechaVuelta}
                error={errores.fechaVuelta}
                onChange={setFechaVuelta}
              />
            </div>
          )}
          <label className="flex min-h-toque cursor-pointer items-center gap-3 self-start font-bold">
            <input
              type="checkbox"
              checked={sinFechas}
              onChange={(evento) => setSinFechas(evento.target.checked)}
              className="size-5 accent-tinta"
            />
            Todavía no sabemos: lo decidimos con una votación
          </label>
        </fieldset>
        {crear.isError && (
          <p role="alert" className="font-semibold text-negativo">
            No pudimos crear el viaje. Revisá la conexión y probá de nuevo.
          </p>
        )}
        <Button type="submit" full disabled={crear.isPending} className="md:w-auto md:self-start">
          {crear.isPending ? 'Creando…' : 'Crear viaje'}
        </Button>
      </form>
      <aside aria-label="Así se va a ver" className="hidden flex-col gap-3 lg:flex lg:w-90">
        <p className="text-sobretitulo uppercase">Así se va a ver</p>
        <TripCard
          title={nombre || 'Tu viaje'}
          place={ubicacion?.nombre || destino || 'Destino'}
          dates={rangoDeFechas(datos.fechaIda, datos.fechaVuelta)}
          stage="previaje"
        />
      </aside>
    </div>
  )
}
