import { Plus } from 'lucide-react'
import { ItineraryItem } from '../ui/ItineraryItem'
import type { ActividadCalendario, TramoCalendario } from './tipos'
import { TONOS, diaDeLaSemanaCorto, diaDelMes, diaDelViaje, fechaLarga, finDe, horaDe, porFecha, tramoDelDia } from './utilidades'

type ListaSemanaProps = {
  dias: string[]
  hoy: string
  actividades: ActividadCalendario[]
  tramos: TramoCalendario[]
  onAbrirDia: (fecha: string) => void
  onCrear?: (fecha: string, hora: string) => void
}

/** La semana en celular: siete columnas no entran, así que va día por día, como la lista de la vista Día. */
export function ListaSemana({ dias, hoy, actividades, tramos, onAbrirDia, onCrear }: ListaSemanaProps) {
  return (
    <ol aria-label="La semana" className="flex flex-col">
      {dias.map((dia) => {
        const delDia = porFecha(actividades, dia)
        const tramo = tramoDelDia(tramos, dia)
        const enElViaje = diaDelViaje(tramos, dia)
        const esHoy = dia === hoy
        return (
          <li key={dia} className="flex gap-3 border-b-2 border-linea px-3 py-3 last:border-b-0">
            <button
              type="button"
              onClick={() => onAbrirDia(dia)}
              aria-label={`Ver ${fechaLarga(dia)}`}
              aria-current={esHoy ? 'date' : undefined}
              className="flex w-12 flex-none flex-col items-center gap-0.5 self-start pt-1"
            >
              <span className="text-sobretitulo text-tinta-suave uppercase">{diaDeLaSemanaCorto(dia)}</span>
              <span className={`grid size-10 place-items-center rounded-full font-display text-titulo-2 font-black numeros ${esHoy ? 'bg-tinta text-papel' : ''}`}>
                {diaDelMes(dia)}
              </span>
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
              {tramo && (
                <span className="flex items-center gap-2 text-meta text-tinta-suave">
                  <span aria-hidden className={`h-2 w-5 rounded-full border-[1.5px] ${TONOS[tramo.tono].lleno}`} />
                  {tramo.destino}
                  {enElViaje && ` · Día ${enElViaje.numero} de ${enElViaje.total}`}
                </span>
              )}
              {delDia.length ? (
                <ol aria-label={fechaLarga(dia)}>
                  {delDia.map((actividad, i) => (
                    <ItineraryItem
                      key={actividad.id}
                      time={actividad.horaFin ? `${actividad.hora} – ${horaDe(finDe(actividad))}` : actividad.hora}
                      title={actividad.titulo}
                      place={actividad.lugar}
                      done={actividad.hecha}
                      current={actividad.ahora}
                      last={i === delDia.length - 1}
                    />
                  ))}
                </ol>
              ) : onCrear ? (
                <button
                  type="button"
                  onClick={() => onCrear(dia, '10:00')}
                  className="flex min-h-toque items-center gap-2 self-start rounded-full border-2 border-dashed px-4 text-meta font-extrabold text-tinta-suave"
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden />
                  Nada planeado. Sumar algo
                </button>
              ) : (
                <p className="py-2 text-meta text-tinta-suave">Nada planeado.</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
