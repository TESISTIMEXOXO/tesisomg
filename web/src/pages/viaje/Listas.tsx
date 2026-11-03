import { Check, Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { TituloPantalla } from '../../components/marca/TituloPantalla'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useMarcarRequisito, useRequisitos } from '../../hooks/baul'
import { useCrearVotacion, useProponerOpcion, useVotaciones } from '../../hooks/votaciones'
import { useViajeActual } from '../../layouts/contextoViaje'
import { CrearVotacionSchema, type Votacion } from '../../types/votacion'
import { Checklists } from './Checklists'
import { puedeEditar } from './nombres'
import { TarjetaVotacion } from './TarjetaVotacion'

function Desplegable({ titulo, abierta = true, children }: { titulo: string; abierta?: boolean; children: ReactNode }) {
  return (
    <details open={abierta} className="rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
      <summary className="flex min-h-toque cursor-pointer items-center font-display text-titulo-1 font-black">{titulo}</summary>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </details>
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

function Requisitos({ viajeId, editable }: { viajeId: string; editable: boolean }) {
  const requisitos = useRequisitos(viajeId)
  const marcar = useMarcarRequisito(viajeId)
  return (
    <>
      {requisitos.isPending && <p className="text-tinta-suave">Cargando los requisitos…</p>}
      {requisitos.error && <p className="text-negativo">No pudimos cargar los requisitos.</p>}
      {requisitos.data?.length === 0 && <p className="text-tinta-suave">Todavía no hay requisitos para este viaje.</p>}
      <ul className="flex flex-col gap-2.5">
        {requisitos.data?.map((requisito) => (
          <li key={requisito.id} className="flex items-start gap-3">
            <button
              type="button"
              aria-label={`${requisito.cumplido ? 'Marcar pendiente' : 'Marcar cumplido'}: ${requisito.titulo}`}
              aria-pressed={requisito.cumplido}
              disabled={!editable || marcar.isPending}
              onClick={() => marcar.mutate({ requisitoId: requisito.id, cumplido: !requisito.cumplido })}
              className={`mt-0.5 grid size-6 flex-none place-items-center rounded-full trazo-fino disabled:cursor-default ${requisito.cumplido ? 'tema-claro bg-mar' : 'bg-papel-elevado'}`}
            >
              {requisito.cumplido && <Check size={14} strokeWidth={2} aria-hidden />}
            </button>
            <span className="flex flex-col">
              <span className="font-bold">
                {requisito.titulo}
                <span className="sr-only">{requisito.cumplido ? ', listo' : ', te falta'}</span>
              </span>
              <span className="text-meta text-tinta-suave">{requisito.detalle}</span>
            </span>
          </li>
        ))}
      </ul>
      {marcar.isError && <p role="alert" className="text-negativo">No pudimos guardar el requisito. Probá de nuevo.</p>}
    </>
  )
}

/** Listas: lo que el grupo tiene que decidir y lo que cada uno tiene que llevar. */
export function Listas() {
  const { viaje, etapa } = useViajeActual()
  const votaciones = useVotaciones(viaje.id)
  const editable = puedeEditar(viaje.personas)
  const soloLectura = etapa === 'post' || !editable


  const abiertas = votaciones.data?.filter((votacion) => votacion.estado === 'abierta') ?? []
  const cerradas = votaciones.data?.filter((votacion) => votacion.estado !== 'abierta') ?? []

  return (
    <>
      <TituloPantalla titulo="Lo que falta resolver" pinz="valija" />
      <div className="flex flex-col gap-12">
        <section aria-labelledby="por-decidir" className="flex flex-col gap-5">
          <h3 id="por-decidir" className="font-display text-titulo-1 font-black lg:text-display">Por decidir</h3>
          {votaciones.isPending && <p className="text-tinta-suave">Cargando las votaciones…</p>}
          {votaciones.error && <NoCargo error={votaciones.error} onReintentar={() => votaciones.refetch()} />}
          {votaciones.data && abiertas.length === 0 && (
            <PinzNote tipo="vacio" pinz="chispa" title="No hay nada por decidir">
              Guarden acá los planes que aparezcan y después los votan.
            </PinzNote>
          )}
          {abiertas.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {abiertas.map((votacion) => (
                <TarjetaVotacion key={votacion.id} votacion={votacion} personas={viaje.personas} soloLectura={soloLectura} />
              ))}
            </div>
          )}
          {!soloLectura && <CrearVotacion viajeId={viaje.id} />}
          {!soloLectura && votaciones.data && <ProponerOpcion viajeId={viaje.id} votaciones={votaciones.data} />}
          {cerradas.length > 0 && (
            <Desplegable titulo="Ya decidido" abierta={false}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {cerradas.map((votacion) => (
                  <TarjetaVotacion key={votacion.id} votacion={votacion} personas={viaje.personas} soloLectura />
                ))}
              </div>
            </Desplegable>
          )}
        </section>

        <Checklists viajeId={viaje.id} personas={viaje.personas} etapa={etapa} editable={editable} />

        <Tarjeta titulo="Requisitos">
          <Requisitos viajeId={viaje.id} editable={editable} />
        </Tarjeta>
      </div>
    </>
  )
}
