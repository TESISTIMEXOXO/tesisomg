import { Calendar, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { ButtonLink } from '../../components/ui/Button'
import { TripCard } from '../../components/ui/TripCard'
import { usePerfil } from '../../hooks/perfil'
import { useViajes } from '../../hooks/viajes'
import { etapaDelViaje } from '../../lib/etapa'
import { diasHasta, mesYAnio, rangoDeFechas } from '../../lib/fechas'
import type { Viaje } from '../../types/viaje'

function personasDe(viaje: Viaje) {
  return viaje.personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))
}

/** Lo que falta para salir y lo pendiente, en una línea. */
function pendienteDe(viaje: Viaje) {
  const faltan = viaje.fechaIda ? diasHasta(viaje.fechaIda) : null
  const cuenta = faltan && faltan > 0 ? `Faltan ${faltan} días` : null
  return [cuenta, viaje.pendiente].filter(Boolean).join(' · ') || null
}

function ViajePasado({ viaje }: { viaje: Viaje }) {
  return (
    <Link to={`/viajes/${viaje.id}`} className="flex items-center gap-3.5 rounded-lg trazo bg-papel-elevado p-3.5 shadow-dura">
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
  )
}

function Seccion({ titulo, viajes }: { titulo: string; viajes: Viaje[] }) {
  if (viajes.length === 0) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-titulo-1 font-black">{titulo}</h2>
      <ul className="grid gap-5 md:grid-cols-2">
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

/** HU-07: todos los viajes, en curso, próximos y pasados. */
export function MisViajes() {
  const { data: perfil } = usePerfil()
  const { data: viajes, isPending, error, refetch } = useViajes()

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
          <ul className="grid gap-3 md:grid-cols-2">
            {pasados.map((viaje) => (
              <li key={viaje.id}>
                <ViajePasado viaje={viaje} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-col gap-3 md:flex-row">
        <ButtonLink to="/viajes/nuevo" icon={Plus} full className="md:w-auto">
          Armar un viaje
        </ButtonLink>
        <ButtonLink to="/unirse" variant="fantasma">
          Unirme con código
        </ButtonLink>
      </div>
    </div>
  )
}
