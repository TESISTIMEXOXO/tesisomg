import { Calendar, ChevronRight, Trash2, UserX } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { Button, ButtonLink } from '../../components/ui/Button'
import { TripCard } from '../../components/ui/TripCard'
import { Ventana } from '../../components/ui/Ventana'
import { usePerfil } from '../../hooks/perfil'
import { useOcultarViaje, useViajes, useViajesSacados } from '../../hooks/viajes'
import { etapaDelViaje } from '../../lib/etapa'
import { diasHasta, mesYAnio, rangoDeFechas } from '../../lib/fechas'
import type { Viaje, ViajeSacado } from '../../types/viaje'

/** Qué se quiere borrar de la lista: un viaje que ya pasó o uno del que te sacaron. */
type ABorrar = { id: string; nombre: string; tipo: 'pasado' | 'sacado' }

function personasDe(viaje: Viaje) {
  return viaje.personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))
}

/** Lo que falta para salir y lo pendiente, en una línea. */
function pendienteDe(viaje: Viaje) {
  const faltan = viaje.fechaIda ? diasHasta(viaje.fechaIda) : null
  const cuenta = faltan && faltan > 0 ? `Faltan ${faltan} días` : null
  return [cuenta, viaje.pendiente].filter(Boolean).join(' · ') || null
}

/** Borra el viaje solo de la lista propia. Va al lado de la tarjeta, no adentro: la tarjeta ya es un link. */
function BotonBorrar({ nombre, onBorrar }: { nombre: string; onBorrar: () => void }) {
  return (
    <Button
      variant="fantasma"
      size="icono"
      icon={Trash2}
      aria-label={`Borrar “${nombre}” de mi lista`}
      aria-haspopup="dialog"
      title="Borrar de mi lista"
      onClick={onBorrar}
    />
  )
}

function ViajePasado({ viaje, onBorrar }: { viaje: Viaje; onBorrar: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Link to={`/viajes/${viaje.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg trazo bg-papel-elevado p-3.5 shadow-dura">
        <span aria-hidden className="grid size-13 flex-none place-items-center rounded-sm trazo tema-claro bg-lavanda">
          <Calendar size={22} strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-cuerpo-lg font-extrabold">{viaje.destino}</span>
          <span className="text-meta text-tinta-suave">
            {viaje.fechaIda ? mesYAnio(viaje.fechaIda) : 'Sin fechas'}
            {viaje.estadoCuentas && ` · ${viaje.estadoCuentas}`}
          </span>
        </span>
        <ChevronRight size={22} strokeWidth={2} aria-hidden />
      </Link>
      <BotonBorrar nombre={viaje.nombre} onBorrar={onBorrar} />
    </div>
  )
}

/** Un viaje del que te sacaron: ya no se puede abrir, solo saber qué pasó y borrarlo de la lista. */
function ViajeSacadoItem({ viaje, onBorrar }: { viaje: ViajeSacado; onBorrar: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg trazo-fino bg-papel-hundido p-3.5">
        <span aria-hidden className="grid size-13 flex-none place-items-center rounded-sm trazo-fino bg-papel-elevado text-tinta-suave">
          <UserX size={22} strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-cuerpo-lg font-extrabold">{viaje.nombre}</span>
          <span className="text-meta text-tinta-suave">
            Te sacó {viaje.por}
            {viaje.baneado && ' · No podés volver'}
          </span>
        </span>
      </div>
      <BotonBorrar nombre={viaje.nombre} onBorrar={onBorrar} />
    </div>
  )
}

function SeccionSacados({ viajes, onBorrar }: { viajes: ViajeSacado[]; onBorrar: (viaje: ABorrar) => void }) {
  if (viajes.length === 0) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-titulo-2 font-black">Viajes de los que te sacaron</h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {viajes.map((viaje) => (
          <li key={viaje.id}>
            <ViajeSacadoItem viaje={viaje} onBorrar={() => onBorrar({ id: viaje.id, nombre: viaje.nombre, tipo: 'sacado' })} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Confirma antes de borrar un viaje de la lista: deja claro que para el grupo no cambia nada. */
function ConfirmarBorrar({ viaje, onCerrar }: { viaje: ABorrar | null; onCerrar: () => void }) {
  const ocultar = useOcultarViaje()
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (viaje && !ventana.current?.open) ventana.current?.showModal()
  }, [viaje])

  function cerrar() {
    ocultar.reset()
    onCerrar()
  }

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={cerrar}>
      {viaje && (
        <div className="flex flex-col gap-4">
          <h2 id={idTitulo} className="pr-12 font-display text-titulo-1 font-black text-balance">
            ¿Borrás “{viaje.nombre}” de tu lista?
          </h2>
          <p>
            {viaje.tipo === 'pasado'
              ? 'Solo desaparece para vos: el resto del grupo lo sigue viendo, con sus gastos y documentos. Si alguien le cambia las fechas, te vuelve a aparecer.'
              : 'Solo desaparece de tu lista. Si te invitan de nuevo y volvés a sumarte, lo vas a ver otra vez.'}
          </p>
          {ocultar.isError && (
            <p role="alert" className="font-semibold text-negativo">
              No pudimos borrarlo. Revisá la conexión y probá de nuevo.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="emergencia"
              icon={Trash2}
              disabled={ocultar.isPending}
              onClick={() => ocultar.mutate(viaje.id, { onSuccess: () => ventana.current?.close() })}
            >
              {ocultar.isPending ? 'Borrando…' : 'Sí, borrar de mi lista'}
            </Button>
            <Button variant="fantasma" onClick={() => ventana.current?.close()}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Ventana>
  )
}

function Seccion({ titulo, viajes }: { titulo: string; viajes: Viaje[] }) {
  if (viajes.length === 0) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-titulo-1 font-black">{titulo}</h2>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {viajes.map((viaje) => (
          <li key={viaje.id}>
            <TripCard
              to={`/viajes/${viaje.id}`}
              title={viaje.nombre}
              place={viaje.destino}
              dates={rangoDeFechas(viaje.fechaIda, viaje.fechaVuelta)}
              stage={etapaDelViaje(viaje)}
              people={personasDe(viaje)}
              pending={pendienteDe(viaje)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** HU-07: todos los viajes, en curso, próximos y pasados. Los pasados y los de los que te sacaron se pueden borrar de la lista. */
export function MisViajes() {
  const { data: perfil } = usePerfil()
  const { data: viajes, isPending, error, refetch } = useViajes()
  // Si esto falla, Mis viajes se muestra igual: es una sección de más, no lo principal.
  const sacados = useViajesSacados().data ?? []
  const [aBorrar, setABorrar] = useState<ABorrar | null>(null)
  const confirmar = <ConfirmarBorrar viaje={aBorrar} onCerrar={() => setABorrar(null)} />

  const saludo = (
    <h1 className="font-display text-display font-black">{perfil ? `Hola, ${perfil.nombre}.` : 'Hola.'}</h1>
  )

  if (isPending) return <Cargando />
  if (error) return <NoCargo error={error} onReintentar={() => refetch()} />

  if (viajes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {saludo}
        <PinzNote tipo="vacio" title="Todavía no tenés viajes" action="Armar un viaje" actionTo="/viajes/nuevo">
          Armá uno o sumate con el código que te pasaron.
        </PinzNote>
        <ButtonLink to="/unirse" variant="secundario" className="self-center">
          Unirme con código
        </ButtonLink>
        <SeccionSacados viajes={sacados} onBorrar={setABorrar} />
        {confirmar}
      </div>
    )
  }

  const enCurso = viajes.filter((v) => etapaDelViaje(v) === 'viaje')
  const proximos = viajes.filter((v) => etapaDelViaje(v) === 'previaje')
  const pasados = viajes.filter((v) => etapaDelViaje(v) === 'post')
  const enMarcha = enCurso.length + proximos.length

  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      <div className="flex flex-col gap-1">
        {saludo}
        {enMarcha > 0 && (
          <p className="font-semibold text-tinta-suave">
            {enMarcha === 1 ? 'Tenés un viaje en marcha.' : `Tenés ${enMarcha} viajes en marcha.`}
          </p>
        )}
      </div>
      <Seccion titulo="En curso" viajes={enCurso} />
      <Seccion titulo="Próximos" viajes={proximos} />
      {pasados.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-titulo-1 font-black">Viajes pasados</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pasados.map((viaje) => (
              <li key={viaje.id}>
                <ViajePasado viaje={viaje} onBorrar={() => setABorrar({ id: viaje.id, nombre: viaje.nombre, tipo: 'pasado' })} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <SeccionSacados viajes={sacados} onBorrar={setABorrar} />
      {confirmar}
    </div>
  )
}
