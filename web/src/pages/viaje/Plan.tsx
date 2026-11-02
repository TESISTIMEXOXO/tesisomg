import { CalendarPlus, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { MapaSlot } from '../../components/slots/MapaSlot'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { SelectorLugar } from '../../components/ui/SelectorLugar'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useAgregarActividad, useExportarCalendario, useItinerario } from '../../hooks/itinerario'
import { useActualizarEtapas } from '../../hooks/viajes'
import { useCrearVotacion, useProponerOpcion, useVotaciones } from '../../hooks/votaciones'
import { useViajeActual } from '../../layouts/contextoViaje'
import { diaCorto } from '../../lib/fechas'
import { conMayuscula } from '../../lib/texto'
import type { ItemItinerario, PuntoMapa } from '../../types/itinerario'
import type { EtapaViaje, LugarViaje } from '../../types/viaje'
import { CrearVotacionSchema, type Votacion } from '../../types/votacion'
import { puedeEditar } from './nombres'
import { TarjetaVotacion } from './TarjetaVotacion'

type EtapaBorrador = Omit<EtapaViaje, 'id' | 'ubicacion'> & { ubicacion: LugarViaje | null }

function diaSiguiente(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

function etapasIniciales(etapas: EtapaViaje[], destino: string, fechaIda: string | null, fechaVuelta: string | null, ubicacion: LugarViaje | null): EtapaBorrador[] {
  if (etapas.length) return etapas.map((etapa) => ({
    destino: etapa.destino,
    fechaIda: etapa.fechaIda,
    fechaVuelta: etapa.fechaVuelta,
    ubicacion: etapa.ubicacion,
  }))
  return [{
    destino,
    fechaIda,
    fechaVuelta,
    ubicacion,
  }]
}

function EditarEtapas({
  viaje,
  soloLectura,
}: {
  viaje: ReturnType<typeof useViajeActual>['viaje']
  soloLectura: boolean
}) {
  const actualizar = useActualizarEtapas(viaje.id)
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [etapas, setEtapas] = useState(() => etapasIniciales(viaje.etapas, viaje.destino, viaje.fechaIda, viaje.fechaVuelta, viaje.ubicacion))

  function cambiar(indice: number, cambios: Partial<EtapaBorrador>) {
    setEtapas((actuales) => actuales.map((etapa, i) => i === indice ? { ...etapa, ...cambios } : etapa))
  }

  function guardar(evento: FormEvent) {
    evento.preventDefault()
    setError('')
    if (etapas.some((etapa) => !etapa.ubicacion)) {
      setError('Elegí un lugar de las sugerencias para cada destino.')
      return
    }
    const completas = etapas.filter((etapa) => etapa.fechaIda && etapa.fechaVuelta)
    if (etapas.some((etapa) => Boolean(etapa.fechaIda) !== Boolean(etapa.fechaVuelta)) || (completas.length > 0 && completas.length !== etapas.length)) {
      setError('Completá las fechas de todas las etapas o dejalas pendientes.')
      return
    }
    for (let indice = 1; indice < etapas.length; indice += 1) {
      const anterior = etapas[indice - 1]
      const etapa = etapas[indice]
      if (anterior?.fechaVuelta && etapa?.fechaIda && diaSiguiente(anterior.fechaVuelta) !== etapa.fechaIda) {
        setError('Las etapas deben ser consecutivas, sin días libres ni superposiciones.')
        return
      }
    }
    actualizar.mutate(etapas.map((etapa) => ({
      destino: etapa.ubicacion!.nombre,
      fechaIda: etapa.fechaIda,
      fechaVuelta: etapa.fechaVuelta,
      ubicacion: etapa.ubicacion!,
    })), {
      onSuccess: (viajeActualizado) => {
        setEtapas(etapasIniciales(viajeActualizado.etapas, viajeActualizado.destino, viajeActualizado.fechaIda, viajeActualizado.fechaVuelta, viajeActualizado.ubicacion))
        setAbierto(false)
      },
    })
  }

  if (soloLectura) return null
  if (!abierto) {
    return (
      <Button
        variant="secundario"
        icon={Plus}
        className="self-start"
        onClick={() => {
          setEtapas(etapasIniciales(viaje.etapas, viaje.destino, viaje.fechaIda, viaje.fechaVuelta, viaje.ubicacion))
          setAbierto(true)
        }}
      >
        Editar destinos y fechas
      </Button>
    )
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      {etapas.map((etapa, indice) => (
        <section key={indice} className="flex flex-col gap-4 border-b border-linea pb-5 last:border-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Destino {indice + 1}</h3>
            {etapas.length > 1 && (
              <Button type="button" variant="fantasma" size="sm" onClick={() => setEtapas((actuales) => actuales.filter((_, i) => i !== indice))}>
                Quitar
              </Button>
            )}
          </div>
          <SelectorLugar
            label="Destino"
            value={etapa.destino}
            hayUbicacion={Boolean(etapa.ubicacion)}
            onChange={(destino) => cambiar(indice, { destino, ubicacion: null })}
            onSelect={(ubicacion) => cambiar(indice, { destino: ubicacion.nombre, ubicacion })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <CampoFecha
              label="Ida"
              min={indice > 0 && etapas[indice - 1]?.fechaVuelta ? diaSiguiente(etapas[indice - 1].fechaVuelta!) : undefined}
              value={etapa.fechaIda ?? ''}
              onChange={(fechaIda) => cambiar(indice, { fechaIda: fechaIda || null })}
            />
            <CampoFecha
              label="Vuelta"
              min={etapa.fechaIda || undefined}
              value={etapa.fechaVuelta ?? ''}
              onChange={(fechaVuelta) => cambiar(indice, { fechaVuelta: fechaVuelta || null })}
            />
          </div>
        </section>
      ))}
      {etapas.length < 20 && (
        <Button
          type="button"
          variant="fantasma"
          icon={Plus}
          className="self-start"
          onClick={() => setEtapas((actuales) => [...actuales, { destino: '', fechaIda: null, fechaVuelta: null, ubicacion: null }])}
        >
          Agregar destino
        </Button>
      )}
      {error && <p role="alert" className="font-semibold text-negativo">{error}</p>}
      {actualizar.isError && <p role="alert" className="font-semibold text-negativo">No pudimos guardar destinos y fechas.</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={actualizar.isPending}>{actualizar.isPending ? 'Guardando…' : 'Guardar etapas'}</Button>
        <Button type="button" variant="fantasma" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

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

function CrearVotacion({ viajeId }: { viajeId: string }) {
  const crear = useCrearVotacion(viajeId)
  const [abierto, setAbierto] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [categoria, setCategoria] = useState<'destino' | 'fechas' | 'alojamiento' | 'actividad' | 'comida'>('actividad')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = CrearVotacionSchema.safeParse({ pregunta, categoria })
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? 'Revisá la pregunta.')
      return
    }
    setError(undefined)
    crear.mutate(resultado.data, {
      onSuccess: () => {
        setPregunta('')
        setAbierto(false)
      },
    })
  }

  if (!abierto) {
    return <Button variant="secundario" icon={Plus} className="self-start" onClick={() => setAbierto(true)}>Crear votación</Button>
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      <TextField label="¿Qué quieren decidir?" placeholder="¿Dónde nos alojamos?" value={pregunta} error={error} onChange={(evento) => setPregunta(evento.target.value)} />
      <label className="flex flex-col gap-1.5">
        <span className="text-etiqueta">Categoría</span>
        <select
          value={categoria}
          onChange={(evento) => setCategoria(evento.target.value as typeof categoria)}
          className="min-h-control rounded-sm trazo bg-papel-elevado px-4 font-semibold shadow-chica"
        >
          <option value="destino">Destino</option>
          <option value="fechas">Fechas</option>
          <option value="alojamiento">Alojamiento</option>
          <option value="actividad">Actividad</option>
          <option value="comida">Comida</option>
        </select>
      </label>
      {crear.isError && <p role="alert" className="font-semibold text-negativo">No pudimos crear la votación. Revisá la conexión y probá de nuevo.</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={crear.isPending}>{crear.isPending ? 'Guardando…' : 'Crear'}</Button>
        <Button variant="fantasma" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

function AgregarActividad({ viajeId }: { viajeId: string }) {
  const agregar = useAgregarActividad(viajeId)
  const [abierto, setAbierto] = useState(false)
  const [datos, setDatos] = useState({ fecha: '', hora: '', titulo: '', lugar: '', lat: null as number | null, lng: null as number | null })
  const [error, setError] = useState<string>()
  const [errorLugar, setErrorLugar] = useState<string>()

  function cambiar(campo: 'fecha' | 'hora' | 'titulo' | 'lugar', valor: string) {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.fecha || !datos.hora || !datos.titulo.trim()) {
      setError('Poné el día, la hora y qué van a hacer.')
      return
    }
    if (datos.lugar.trim() && (datos.lat === null || datos.lng === null)) {
      setErrorLugar('Elegí el lugar de las sugerencias para agregarlo al mapa.')
      return
    }
    setError(undefined)
    setErrorLugar(undefined)
    agregar.mutate(
      { ...datos, lugar: datos.lugar.trim() || null },
      {
        onSuccess: () => {
          setDatos({ fecha: '', hora: '', titulo: '', lugar: '', lat: null, lng: null })
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
        <CampoFecha label="Día" value={datos.fecha} onChange={(fecha) => cambiar('fecha', fecha)} />
        <TextField label="Hora" type="time" value={datos.hora} onChange={(evento) => cambiar('hora', evento.target.value)} />
      </div>
      <TextField label="Qué van a hacer" value={datos.titulo} error={error} onChange={(evento) => cambiar('titulo', evento.target.value)} />
      <SelectorLugar
        label="Dónde (opcional)"
        value={datos.lugar}
        error={errorLugar}
        hayUbicacion={datos.lat !== null && datos.lng !== null}
        onChange={(lugar) => {
          setErrorLugar(undefined)
          setDatos((anteriores) => ({ ...anteriores, lugar, lat: null, lng: null }))
        }}
        onSelect={(lugar) => {
          setErrorLugar(undefined)
          setDatos((anteriores) => ({ ...anteriores, lugar: lugar.nombre, lat: lugar.lat, lng: lugar.lng }))
        }}
      />
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
  const etapas = viaje.etapas.length
    ? viaje.etapas
    : viaje.ubicacion
      ? [{ id: 'destino', destino: viaje.destino, fechaIda: viaje.fechaIda, fechaVuelta: viaje.fechaVuelta, ubicacion: viaje.ubicacion }]
      : []
  const centroMapa = etapas[0]?.ubicacion ?? viaje.ubicacion
  const puntosMapa: PuntoMapa[] = [
    ...etapas.map((etapaViaje) => ({
      id: etapaViaje.id,
      nombre: etapaViaje.destino,
      lat: etapaViaje.ubicacion.lat,
      lng: etapaViaje.ubicacion.lng,
      tipo: 'alojamiento' as const,
    })),
    ...(itinerario.data ?? []).flatMap((actividad) => actividad.lat !== null && actividad.lng !== null
      ? [{
          id: actividad.id,
          nombre: actividad.lugar ?? actividad.titulo,
          lat: actividad.lat,
          lng: actividad.lng,
          tipo: 'actividad' as const,
        }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="destinos" className="flex flex-col gap-5">
        <h2 id="destinos" className="font-display text-display font-black">Destinos y fechas</h2>
        <ol className="flex flex-wrap gap-3">
          {etapas.map((etapaViaje, indice) => (
            <li key={etapaViaje.id} className="rounded-full trazo-fino bg-papel-hundido px-4 py-2 font-semibold">
              {indice + 1}. {etapaViaje.destino}
              {etapaViaje.fechaIda && etapaViaje.fechaVuelta && ` · ${diaCorto(etapaViaje.fechaIda)}–${diaCorto(etapaViaje.fechaVuelta)}`}
            </li>
          ))}
        </ol>
        {!soloLectura && <EditarEtapas viaje={viaje} soloLectura={soloLectura} />}
      </section>
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
        {!soloLectura && <CrearVotacion viajeId={viaje.id} />}
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
          <MapaSlot puntos={puntosMapa} personas={[]} centro={centroMapa} alto="grande" />
        </div>
      </section>
    </div>
  )
}
