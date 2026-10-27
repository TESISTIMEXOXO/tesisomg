import { CalendarPlus, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { MapaSlot } from '../../components/slots/MapaSlot'
import { Button } from '../../components/ui/Button'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useAgregarActividad, useExportarCalendario, useItinerario } from '../../hooks/itinerario'
import { useProponerOpcion, useVotaciones } from '../../hooks/votaciones'
import { useViajeActual } from '../../layouts/contextoViaje'
import { diaCorto } from '../../lib/fechas'
import { conMayuscula } from '../../lib/texto'
import type { ItemItinerario } from '../../types/itinerario'
import type { Votacion } from '../../types/votacion'
import { puedeEditar } from './nombres'
import { TarjetaVotacion } from './TarjetaVotacion'

function ProponerOpcion({ viajeId, votaciones }: { viajeId: string; votaciones: Votacion[] }) {
  const proponer = useProponerOpcion(viajeId)
  const abiertas = votaciones.filter((v) => v.estado === 'abierta')
  const [abierto, setAbierto] = useState(false)
  const [votacionId, setVotacionId] = useState(abiertas[0]?.id ?? '')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string>()

  if (abiertas.length === 0) return null

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nombre.trim()) {
      setError('Contanos qué proponés.')
      return
    }
    setError(undefined)
    proponer.mutate(
      { votacionId, nombre, detalle: null },
      {
        onSuccess: () => {
          setNombre('')
          setAbierto(false)
        },
      },
    )
  }

  if (!abierto) {
    return (
      <Button variant="secundario" icon={Plus} className="self-start" onClick={() => setAbierto(true)}>
        Proponer una opción
      </Button>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-etiqueta">¿Para qué votación?</span>
        <select
          value={votacionId}
          onChange={(evento) => setVotacionId(evento.target.value)}
          className="min-h-control rounded-sm trazo bg-papel-elevado px-4 font-semibold shadow-chica"
        >
          {abiertas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.pregunta}
            </option>
          ))}
        </select>
      </label>
      <TextField label="Tu propuesta" value={nombre} error={error} onChange={(evento) => setNombre(evento.target.value)} />
      {proponer.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos guardar la propuesta. Revisá la conexión y probá de nuevo.
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={proponer.isPending}>
          Proponer
        </Button>
        <Button variant="fantasma" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function AgregarActividad({ viajeId }: { viajeId: string }) {
  const agregar = useAgregarActividad(viajeId)
  const [abierto, setAbierto] = useState(false)
  const [datos, setDatos] = useState({ fecha: '', hora: '', titulo: '', lugar: '' })
  const [error, setError] = useState<string>()

  function cambiar(campo: keyof typeof datos, valor: string) {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.fecha || !datos.hora || !datos.titulo.trim()) {
      setError('Poné el día, la hora y qué van a hacer.')
      return
    }
    setError(undefined)
    agregar.mutate(
      { ...datos, lugar: datos.lugar.trim() || null },
      {
        onSuccess: () => {
          setDatos({ fecha: '', hora: '', titulo: '', lugar: '' })
          setAbierto(false)
        },
      },
    )
  }

  if (!abierto) {
    return (
      <Button variant="secundario" icon={Plus} className="self-start" onClick={() => setAbierto(true)}>
        Agregar actividad
      </Button>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Día" type="date" value={datos.fecha} onChange={(evento) => cambiar('fecha', evento.target.value)} />
        <TextField label="Hora" type="time" value={datos.hora} onChange={(evento) => cambiar('hora', evento.target.value)} />
      </div>
      <TextField label="Qué van a hacer" value={datos.titulo} error={error} onChange={(evento) => cambiar('titulo', evento.target.value)} />
      <TextField label="Dónde" hint="Opcional." value={datos.lugar} onChange={(evento) => cambiar('lugar', evento.target.value)} />
      {agregar.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos guardar la actividad. Revisá la conexión y probá de nuevo.
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={agregar.isPending}>
          Agregar
        </Button>
        <Button variant="fantasma" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function porDia(items: ItemItinerario[]) {
  const dias = new Map<string, ItemItinerario[]>()
  for (const item of items) dias.set(item.fecha, [...(dias.get(item.fecha) ?? []), item])
  return [...dias.entries()]
}

/** Plan: Decidir (votaciones), el itinerario día por día y el mapa. En Post-viaje queda como recuerdo. */
export function Plan() {
  const { viaje, etapa } = useViajeActual()
  const votaciones = useVotaciones(viaje.id)
  const itinerario = useItinerario(viaje.id)
  const exportar = useExportarCalendario(viaje.id)
  const soloLectura = etapa === 'post' || !puedeEditar(viaje.personas)

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="decidir" className="flex flex-col gap-5">
        <h2 id="decidir" className="font-display text-display font-black">
          Decidir
        </h2>
        {votaciones.isPending && <Cargando pinz="chispa" />}
        {votaciones.error && <NoCargo error={votaciones.error} onReintentar={() => votaciones.refetch()} />}
        {votaciones.data?.length === 0 && (
          <PinzNote tipo="vacio" pinz="chispa" title="Todavía no hay ideas">
            Guarden acá los planes que aparezcan y después los votan.
          </PinzNote>
        )}
        {votaciones.data && votaciones.data.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {votaciones.data.map((votacion) => (
              <TarjetaVotacion key={votacion.id} votacion={votacion} personas={viaje.personas} soloLectura={soloLectura} />
            ))}
          </div>
        )}
        {!soloLectura && votaciones.data && <ProponerOpcion viajeId={viaje.id} votaciones={votaciones.data} />}
      </section>

      <section aria-labelledby="itinerario" className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="itinerario" className="font-display text-display font-black">
              Itinerario
            </h2>
            <Button
              variant="secundario"
              size="sm"
              icon={CalendarPlus}
              disabled={exportar.isPending || !itinerario.data?.length}
              onClick={() => exportar.mutate()}
            >
              Sincronizar con el calendario
            </Button>
          </div>
          {itinerario.isPending && <p className="text-tinta-suave">Cargando el itinerario…</p>}
          {itinerario.error && (
            <p role="alert" className="text-negativo">
              No pudimos cargar el itinerario.
            </p>
          )}
          {!soloLectura && <AgregarActividad viajeId={viaje.id} />}
          {itinerario.data?.length === 0 && (
            <p className="text-tinta-suave">Todavía no hay actividades. Sumá al menos una para armar el día.</p>
          )}
          {itinerario.data &&
            porDia(itinerario.data).map(([fecha, items]) => (
              <Tarjeta key={fecha} titulo={conMayuscula(diaCorto(fecha))}>
                <ol>
                  {items.map((item, i) => (
                    <ItineraryItem
                      key={item.id}
                      time={item.hora}
                      title={item.titulo}
                      place={item.lugar}
                      done={item.estado === 'hecho'}
                      current={etapa === 'viaje' && item.estado === 'ahora'}
                      last={i === items.length - 1}
                    />
                  ))}
                </ol>
              </Tarjeta>
            ))}
        </div>
        <div className="flex flex-col gap-5 lg:pt-17">
          <MapaSlot puntos={[]} personas={[]} alto="grande" />
        </div>
      </section>
    </div>
  )
}
