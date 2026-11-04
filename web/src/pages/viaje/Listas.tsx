import { Check, ChevronDown, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CaminosDeLaVentana } from '../../components/marca/CaminosDeLaVentana'
import { NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { Button } from '../../components/ui/Button'
import { Despliegue } from '../../components/ui/Despliegue'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { Ventana } from '../../components/ui/Ventana'
import { useMarcarRequisito, useRequisitos } from '../../hooks/baul'
import { useCrearVotacion, useProponerOpcion, useVotaciones } from '../../hooks/votaciones'
import { useViajeActual } from '../../layouts/contextoViaje'
import { CategoriaVotacionSchema, CrearVotacionSchema, type CategoriaVotacion, type Votacion } from '../../types/votacion'
import { Checklists } from './Checklists'
import { EditarVotacion } from './EditarVotacion'
import { esOrganizador, puedeEditar } from './nombres'
import { TarjetaVotacion } from './TarjetaVotacion'

function Desplegable({ titulo, abierta: abiertaAlInicio = true, children }: { titulo: string; abierta?: boolean; children: ReactNode }) {
  const [abierta, setAbierta] = useState(abiertaAlInicio)
  const idContenido = useId()

  return (
    <section className="rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
      <h3>
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={idContenido}
          onClick={() => setAbierta((actual) => !actual)}
          className="flex min-h-toque w-full items-center justify-between gap-3 text-left font-display text-titulo-1 font-black select-none"
        >
          {titulo}
          <ChevronDown
            size={22}
            strokeWidth={2}
            aria-hidden
            className={`shrink-0 text-tinta-suave transition-transform duration-300 motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <Despliegue abierta={abierta} id={idContenido}>
        <div className="flex flex-col gap-4 pt-3">{children}</div>
      </Despliegue>
    </section>
  )
}

const CATEGORIAS: { id: CategoriaVotacion; nombre: string }[] = [
  { id: 'destino', nombre: 'Destino' },
  { id: 'fechas', nombre: 'Fechas' },
  { id: 'alojamiento', nombre: 'Alojamiento' },
  { id: 'actividad', nombre: 'Actividad' },
  { id: 'comida', nombre: 'Comida' },
  { id: 'otros', nombre: 'Otros' },
]

function ProponerOpcion({ viajeId, abiertas, idTitulo, onCerrar }: { viajeId: string; abiertas: Votacion[]; idTitulo: string; onCerrar: () => void }) {
  const proponer = useProponerOpcion(viajeId)
  const [votacionId, setVotacionId] = useState(abiertas[0]?.id ?? '')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nombre.trim()) {
      setError('Contanos qué proponés.')
      return
    }
    setError(undefined)
    proponer.mutate({ votacionId, nombre, detalle: null }, { onSuccess: onCerrar })
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className="flex flex-col gap-4">
      <h2 id={idTitulo} className="pr-24 font-display text-titulo-1 font-black">Proponer una opción</h2>
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
        <Button variant="fantasma" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function CrearVotacion({ viajeId, idTitulo, onCerrar }: { viajeId: string; idTitulo: string; onCerrar: () => void }) {
  const crear = useCrearVotacion(viajeId)
  const [pregunta, setPregunta] = useState('')
  const [categoria, setCategoria] = useState<CategoriaVotacion>('actividad')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = CrearVotacionSchema.safeParse({ pregunta, categoria })
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? 'Revisá la pregunta.')
      return
    }
    setError(undefined)
    crear.mutate(resultado.data, { onSuccess: onCerrar })
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className="flex flex-col gap-4">
      <h2 id={idTitulo} className="pr-24 font-display text-titulo-1 font-black">Crear votación</h2>
      <TextField label="¿Qué quieren decidir?" placeholder="¿Dónde nos alojamos?" value={pregunta} error={error} onChange={(evento) => setPregunta(evento.target.value)} />
      <label className="flex flex-col gap-1.5">
        <span className="text-etiqueta">Categoría</span>
        <select
          value={categoria}
          onChange={(evento) => setCategoria(CategoriaVotacionSchema.parse(evento.target.value))}
          className="min-h-control rounded-sm trazo bg-papel-elevado px-4 font-semibold shadow-chica"
        >
          {CATEGORIAS.map(({ id, nombre }) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      {crear.isError && <p role="alert" className="font-semibold text-negativo">No pudimos crear la votación. Revisá la conexión y probá de nuevo.</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={crear.isPending}>{crear.isPending ? 'Guardando…' : 'Crear'}</Button>
        <Button variant="fantasma" onClick={onCerrar}>Cancelar</Button>
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

/** Listas: las votaciones del grupo, lo que cada uno tiene que llevar y los requisitos. */
export function Listas() {
  const { viaje, etapa } = useViajeActual()
  const votaciones = useVotaciones(viaje.id)
  const editable = puedeEditar(viaje.personas)
  const soloLectura = etapa === 'post' || !editable
  /* En Post-viaje las votaciones quedan como recuerdo: ni quien organiza las toca. */
  const administra = etapa !== 'post' && esOrganizador(viaje.personas)
  const [formulario, setFormulario] = useState<'crear' | 'proponer' | { editar: Votacion } | null>(null)
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  /* Se abre después de pintar el formulario: showModal enfoca su primer campo. */
  useEffect(() => {
    if (formulario && !ventana.current?.open) ventana.current?.showModal()
  }, [formulario])

  const abiertas = votaciones.data?.filter((votacion) => votacion.estado === 'abierta') ?? []
  const cerradas = votaciones.data?.filter((votacion) => votacion.estado !== 'abierta') ?? []
  /* Cerrar la ventana dispara su onClose, que es el que limpia el formulario. */
  const cerrarFormulario = () => ventana.current?.close()

  return (
    <>
      <div className="flex flex-col gap-12">
        <section aria-labelledby="votaciones" className="flex flex-col gap-5">
          <h2 id="votaciones" className="font-display text-titulo-1 font-black lg:text-display">Votaciones grupales</h2>
          {!soloLectura && (
            <div className="flex flex-wrap gap-3">
              <Button variant="secundario" icon={Plus} aria-haspopup="dialog" onClick={() => setFormulario('crear')}>
                Crear votación
              </Button>
              {abiertas.length > 0 && (
                <Button variant="secundario" icon={Plus} aria-haspopup="dialog" onClick={() => setFormulario('proponer')}>
                  Proponer una opción
                </Button>
              )}
            </div>
          )}
          <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={() => setFormulario(null)}>
            <CaminosDeLaVentana />
            {/* Como en el ingreso: sin el contorno del foco, el campo activo ya se marca con su sombra más grande. */}
            <div className="relative [&_input]:outline-none">
              {formulario === 'crear' && <CrearVotacion viajeId={viaje.id} idTitulo={idTitulo} onCerrar={cerrarFormulario} />}
              {formulario === 'proponer' && abiertas.length > 0 && (
                <ProponerOpcion viajeId={viaje.id} abiertas={abiertas} idTitulo={idTitulo} onCerrar={cerrarFormulario} />
              )}
              {typeof formulario === 'object' && formulario !== null && (
                <EditarVotacion key={formulario.editar.id} votacion={formulario.editar} idTitulo={idTitulo} onCerrar={cerrarFormulario} />
              )}
            </div>
          </Ventana>
          {votaciones.isPending && <p className="text-tinta-suave">Cargando las votaciones…</p>}
          {votaciones.error && <NoCargo error={votaciones.error} onReintentar={() => votaciones.refetch()} />}
          {votaciones.data && abiertas.length === 0 && (
            <PinzNote tipo="vacio" pinz="chispa" title="No hay votaciones abiertas">
              Guarden acá los planes que aparezcan y después los votan.
            </PinzNote>
          )}
          {abiertas.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {abiertas.map((votacion) => (
                <TarjetaVotacion
                  key={votacion.id}
                  votacion={votacion}
                  personas={viaje.personas}
                  soloLectura={soloLectura}
                  onEditar={administra ? () => setFormulario({ editar: votacion }) : undefined}
                />
              ))}
            </div>
          )}
          {cerradas.length > 0 && (
            <Desplegable titulo="Votaciones cerradas" abierta={false}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {cerradas.map((votacion) => (
                  <TarjetaVotacion
                    key={votacion.id}
                    votacion={votacion}
                    personas={viaje.personas}
                    soloLectura
                  />
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
