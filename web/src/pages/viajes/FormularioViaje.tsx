import { Check, Plus, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapaSlot } from '../../components/slots/MapaSlot'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { SelectorLugar } from '../../components/ui/SelectorLugar'
import { TextField } from '../../components/ui/TextField'
import { TripCard } from '../../components/ui/TripCard'
import { useCrearViaje } from '../../hooks/viajes'
import { rangoDeFechas } from '../../lib/fechas'
import { NuevoViajeSchema, type LugarViaje } from '../../types/viaje'

type EtapaBorrador = {
  destino: string
  ubicacion: LugarViaje | null
  fechaIda: string
  fechaVuelta: string
}

function diaSiguiente(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

type FormularioViajeProps = {
  /** El título: en la página es más grande que en la ventana del +. */
  encabezado: ReactNode
  idTitulo?: string
  /** En la página, al lado del formulario, cómo va a quedar la tarjeta y el mapa. */
  conVistaPrevia?: boolean
  /** Antes de ir al viaje creado, por ejemplo para cerrar la ventana. */
  onListo?: () => void
}

/** HU-04: armar un viaje con uno o varios destinos y fechas, o sin fechas todavía. Al crearlo, lleva al viaje. */
export function FormularioViaje({ encabezado, idTitulo, conVistaPrevia = false, onListo }: FormularioViajeProps) {
  const navigate = useNavigate()
  const crear = useCrearViaje()
  const [nombre, setNombre] = useState('')
  const [etapas, setEtapas] = useState<EtapaBorrador[]>([
    { destino: '', ubicacion: null, fechaIda: '', fechaVuelta: '' },
  ])
  const [sinFechas, setSinFechas] = useState(false)
  const [errores, setErrores] = useState<{ nombre?: string; etapas?: string }>({})

  function cambiarEtapa(indice: number, cambios: Partial<EtapaBorrador>) {
    setEtapas((actuales) => actuales.map((etapa, i) => i === indice ? { ...etapa, ...cambios } : etapa))
  }

  const primera = etapas[0]
  const ultima = etapas.at(-1)
  const puntos = etapas.flatMap((etapa, indice) => etapa.ubicacion
    ? [{ id: `etapa-${indice}`, nombre: etapa.destino || etapa.ubicacion.nombre, lat: etapa.ubicacion.lat, lng: etapa.ubicacion.lng, tipo: 'alojamiento' as const }]
    : [])

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrores({})
    if (!primera || !ultima) return

    if (etapas.some((etapa) => !etapa.ubicacion)) {
      setErrores({ etapas: 'Elegí un lugar de las sugerencias para cada destino.' })
      return
    }
    const conFecha = etapas.filter((etapa) => etapa.fechaIda || etapa.fechaVuelta)
    if (conFecha.length !== 0 && conFecha.length !== etapas.length) {
      setErrores({ etapas: 'Completá las fechas de todas las etapas o dejalas pendientes.' })
      return
    }
    for (let indice = 0; indice < etapas.length; indice += 1) {
      const etapa = etapas[indice]
      if (!etapa) continue
      if ((etapa.fechaIda && !etapa.fechaVuelta) || (!etapa.fechaIda && etapa.fechaVuelta)) {
        setErrores({ etapas: 'Cada etapa necesita fecha de ida y vuelta.' })
        return
      }
      if (etapa.fechaIda && etapa.fechaVuelta && etapa.fechaVuelta < etapa.fechaIda) {
        setErrores({ etapas: 'La vuelta de cada etapa tiene que ser después de la ida.' })
        return
      }
      const anterior = etapas[indice - 1]
      if (anterior?.fechaVuelta && etapa.fechaIda && diaSiguiente(anterior.fechaVuelta) !== etapa.fechaIda) {
        setErrores({ etapas: 'Las etapas deben ser consecutivas, sin días libres ni superposiciones.' })
        return
      }
    }

    const datos = {
      nombre,
      destino: primera.destino,
      ubicacion: primera.ubicacion,
      fechaIda: primera.fechaIda || null,
      fechaVuelta: ultima.fechaVuelta || null,
      etapas: etapas.map((etapa) => ({
        destino: etapa.ubicacion?.nombre ?? etapa.destino,
        fechaIda: etapa.fechaIda || null,
        fechaVuelta: etapa.fechaVuelta || null,
        ubicacion: etapa.ubicacion,
      })),
    }
    const resultado = NuevoViajeSchema.safeParse(datos)
    if (!resultado.success) {
      setErrores({
        nombre: resultado.error.issues.find((issue) => issue.path[0] === 'nombre')?.message,
        etapas: resultado.error.issues.find((issue) => issue.path[0] !== 'nombre')?.message,
      })
      return
    }
    crear.mutate(resultado.data, {
      onSuccess: (viaje) => {
        onListo?.()
        navigate(`/viajes/${viaje.id}`)
      },
    })
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className="flex flex-1 flex-col gap-6 lg:max-w-140">
        {encabezado}
        <TextField
          label="¿Cómo se llama el viaje?"
          hint="Como lo nombrarían en el grupo."
          placeholder="Bariloche con los chicos"
          value={nombre}
          error={errores.nombre}
          onChange={(evento) => setNombre(evento.target.value)}
        />
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-2 text-etiqueta">Destinos y fechas</legend>
          {etapas.map((etapa, indice) => (
            <section key={indice} className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-titulo-2 font-black">Destino {indice + 1}</h3>
                {etapas.length > 1 && (
                  <Button
                    type="button"
                    variant="fantasma"
                    size="sm"
                    icon={X}
                    aria-label={`Quitar destino ${indice + 1}`}
                    onClick={() => setEtapas((actuales) => actuales.filter((_, i) => i !== indice))}
                  />
                )}
              </div>
              <SelectorLugar
                label="¿A dónde van?"
                value={etapa.destino}
                error={errores.etapas}
                hayUbicacion={Boolean(etapa.ubicacion)}
                onChange={(destino) => cambiarEtapa(indice, { destino, ubicacion: null })}
                onSelect={(ubicacion) => cambiarEtapa(indice, { destino: ubicacion.nombre, ubicacion })}
              />
              {!sinFechas && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CampoFecha
                    label="Ida"
                    min={indice > 0 && etapas[indice - 1]?.fechaVuelta ? diaSiguiente(etapas[indice - 1].fechaVuelta) : undefined}
                    value={etapa.fechaIda}
                    onChange={(fechaIda) => cambiarEtapa(indice, { fechaIda })}
                  />
                  <CampoFecha
                    label="Vuelta"
                    min={etapa.fechaIda || undefined}
                    value={etapa.fechaVuelta}
                    onChange={(fechaVuelta) => cambiarEtapa(indice, { fechaVuelta })}
                  />
                </div>
              )}
            </section>
          ))}
          {errores.etapas && <p role="alert" className="font-semibold text-negativo">{errores.etapas}</p>}
          {etapas.length < 20 && (
            <Button
              type="button"
              variant="secundario"
              icon={Plus}
              className="self-start"
              onClick={() => setEtapas((actuales) => [...actuales, { destino: '', ubicacion: null, fechaIda: '', fechaVuelta: '' }])}
            >
              Agregar destino
            </Button>
          )}
          <label className="flex min-h-toque cursor-pointer items-center gap-3 self-start font-bold">
            <input
              type="checkbox"
              checked={sinFechas}
              onChange={(evento) => {
                setSinFechas(evento.target.checked)
                if (evento.target.checked) {
                  setEtapas((actuales) => actuales.map((etapa) => ({ ...etapa, fechaIda: '', fechaVuelta: '' })))
                }
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="grid size-6 flex-none place-items-center rounded-sm trazo bg-papel-elevado peer-checked:bg-tinta peer-checked:text-papel peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3"
            >
              {sinFechas && <Check size={16} strokeWidth={2} />}
            </span>
            Todavía no sabemos: lo decidimos con una votación
          </label>
        </fieldset>
        {crear.isError && (
          <p role="alert" className="font-semibold text-negativo">
            No pudimos crear el viaje. Revisá las fechas y la conexión y probá de nuevo.
          </p>
        )}
        <Button type="submit" full disabled={crear.isPending} className="md:w-auto md:self-start">
          {crear.isPending ? 'Creando…' : 'Crear viaje'}
        </Button>
      </form>
      {conVistaPrevia && (
        <aside aria-label="Así se va a ver" className="hidden flex-col gap-3 lg:flex lg:w-90">
          <p className="text-sobretitulo uppercase">Así se va a ver</p>
          <TripCard
            title={nombre || 'Tu viaje'}
            place={etapas.map((etapa) => etapa.ubicacion?.nombre || etapa.destino || 'Destino').join(' → ')}
            dates={rangoDeFechas(primera?.fechaIda || null, ultima?.fechaVuelta || null)}
            stage="previaje"
          />
          <MapaSlot puntos={puntos} personas={[]} centro={primera?.ubicacion} />
        </aside>
      )}
    </div>
  )
}
