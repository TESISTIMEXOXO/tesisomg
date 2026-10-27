import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { TripCard } from '../../components/ui/TripCard'
import { useCrearViaje } from '../../hooks/viajes'
import { rangoDeFechas } from '../../lib/fechas'
import { NuevoViajeSchema } from '../../types/viaje'

type Errores = Partial<Record<'nombre' | 'destino' | 'fechaVuelta', string>>

/** HU-04: armar un viaje con destino y fechas, o sin fechas todavía. */
export function NuevoViaje() {
  const navigate = useNavigate()
  const crear = useCrearViaje()
  const [nombre, setNombre] = useState('')
  const [destino, setDestino] = useState('')
  const [fechaIda, setFechaIda] = useState('')
  const [fechaVuelta, setFechaVuelta] = useState('')
  const [sinFechas, setSinFechas] = useState(false)
  const [errores, setErrores] = useState<Errores>({})

  const datos = {
    nombre,
    destino,
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
          onChange={(evento) => setDestino(evento.target.value)}
        />
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
              <TextField label="Ida" type="date" value={fechaIda} onChange={(evento) => setFechaIda(evento.target.value)} />
              <TextField
                label="Vuelta"
                type="date"
                min={fechaIda || undefined}
                value={fechaVuelta}
                error={errores.fechaVuelta}
                onChange={(evento) => setFechaVuelta(evento.target.value)}
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
          place={destino || 'Destino'}
          dates={rangoDeFechas(datos.fechaIda, datos.fechaVuelta)}
          stage="previaje"
        />
      </aside>
    </div>
  )
}
