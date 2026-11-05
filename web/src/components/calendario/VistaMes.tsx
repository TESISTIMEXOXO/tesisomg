import { Check } from 'lucide-react'
import type { ActividadCalendario, TramoCalendario } from './tipos'
import { Cinta } from './Cinta'
import { DIAS_CORTOS_LUNES, TONOS, cintasDeLaFila, diaDelMes, fechaLarga, porFecha, tramoDelDia } from './utilidades'

type VistaMesProps = {
  /** Los días de la grilla, de lunes a domingo, con las semanas completas. */
  dias: string[]
  /** Un día del mes que se está viendo: los de otros meses van apagados. */
  fecha: string
  hoy: string
  actividades: ActividadCalendario[]
  tramos: TramoCalendario[]
  esCelular: boolean
  onAbrirDia: (fecha: string) => void
  onAbrirActividad?: (actividad: ActividadCalendario) => void
}

const VISIBLES = 3

/** El mes en una grilla: cada día con sus actividades y los destinos como cintas que cruzan los días. */
export function VistaMes({ dias, fecha, hoy, actividades, tramos, esCelular, onAbrirDia, onAbrirActividad }: VistaMesProps) {
  const semanas = Array.from({ length: dias.length / 7 }, (_, i) => dias.slice(i * 7, i * 7 + 7))
  const mes = fecha.slice(0, 7)

  return (
    <div role="grid" aria-label="Mes" className="flex flex-col">
      <div role="row" className="grid grid-cols-7 trazo-b bg-papel-hundido">
        {DIAS_CORTOS_LUNES.map((dia) => (
          <span key={dia} role="columnheader" className="py-2.5 text-center text-sobretitulo text-tinta-suave uppercase">
            {dia}
          </span>
        ))}
      </div>
      {semanas.map((semana) => {
        const { cintas, carriles } = cintasDeLaFila(tramos, semana)
        return (
          <div
            key={semana[0]}
            role="row"
            className="grid grid-cols-7 border-b-2 border-linea last:border-b-0"
            style={{ gridTemplateRows: carriles ? `auto repeat(${carriles}, auto) 1fr` : 'auto 1fr' }}
          >
            {semana.map((dia, i) => {
              const tramo = tramoDelDia(tramos, dia)
              return (
                <div
                  key={`fondo-${dia}`}
                  aria-hidden
                  className={`${i < 6 ? 'border-r-2 border-linea' : ''} ${dia.slice(0, 7) !== mes ? 'bg-papel-hundido/60' : tramo ? TONOS[tramo.tono].suave : ''}`}
                  style={{ gridColumn: i + 1, gridRow: '1 / -1' }}
                />
              )
            })}

            {semana.map((dia, i) => {
              const delDia = porFecha(actividades, dia)
              const esHoy = dia === hoy
              const deOtroMes = dia.slice(0, 7) !== mes
              return (
                <div key={`numero-${dia}`} role="gridcell" className="flex justify-center pt-2 pb-1" style={{ gridColumn: i + 1, gridRow: 1 }}>
                  <button
                    type="button"
                    onClick={() => onAbrirDia(dia)}
                    aria-label={`${fechaLarga(dia)}${delDia.length ? `, ${delDia.length === 1 ? '1 actividad' : `${delDia.length} actividades`}` : ''}`}
                    aria-current={esHoy ? 'date' : undefined}
                    className={`grid size-8 place-items-center rounded-full text-etiqueta numeros transition-colors ${
                      esHoy ? 'bg-tinta text-papel' : `hover:bg-papel-hundido ${deOtroMes ? 'text-tinta-suave opacity-60' : ''}`
                    }`}
                  >
                    {diaDelMes(dia)}
                  </button>
                </div>
              )
            })}

            {cintas.map(({ tramo, desde, hasta, carril, sigueAntes, sigueDespues }) => (
              <Cinta
                key={tramo.id}
                tramo={tramo}
                fina={esCelular}
                sigueAntes={sigueAntes}
                sigueDespues={sigueDespues}
                style={{ gridColumn: `${desde + 1} / ${hasta + 2}`, gridRow: carril + 2 }}
              />
            ))}

            {semana.map((dia, i) => {
              const delDia = porFecha(actividades, dia)
              const restantes = delDia.length - VISIBLES
              return (
                <div
                  key={`actividades-${dia}`}
                  className="flex min-h-14 min-w-0 flex-col gap-0.5 px-1 pt-1 pb-2 md:min-h-20"
                  style={{ gridColumn: i + 1, gridRow: carriles + 2 }}
                >
                  {esCelular ? (
                    delDia.length > 0 && (
                      <button type="button" onClick={() => onAbrirDia(dia)} className="flex flex-wrap justify-center gap-1 pt-0.5" aria-label={`Ver ${fechaLarga(dia)}`}>
                        {delDia.slice(0, 4).map((actividad) => (
                          <span
                            key={actividad.id}
                            className={`size-2.5 rounded-full border-[1.5px] ${actividad.hecha ? 'bg-papel-hundido' : TONOS[actividad.tono].lleno}`}
                          />
                        ))}
                      </button>
                    )
                  ) : (
                    <>
                      {delDia.slice(0, restantes > 0 ? VISIBLES - 1 : VISIBLES).map((actividad) => (
                        <button
                          key={actividad.id}
                          type="button"
                          onClick={() => onAbrirActividad?.(actividad)}
                          className={`flex min-w-0 items-center gap-1.5 rounded-[8px] px-1.5 py-0.5 text-left text-meta hover:bg-papel-elevado ${actividad.hecha ? 'text-tinta-suave' : ''}`}
                        >
                          {actividad.hecha ? (
                            <Check size={12} strokeWidth={3} aria-hidden className="flex-none" />
                          ) : (
                            <span aria-hidden className={`size-2.5 flex-none rounded-full border-[1.5px] ${TONOS[actividad.tono].lleno}`} />
                          )}
                          <span className="flex-none numeros text-tinta-suave">{actividad.hora}</span>
                          <span className="truncate font-extrabold">{actividad.titulo}</span>
                        </button>
                      ))}
                      {restantes > 0 && (
                        <button
                          type="button"
                          onClick={() => onAbrirDia(dia)}
                          className="self-start rounded-[8px] px-1.5 py-0.5 text-meta font-extrabold underline decoration-2 underline-offset-2 hover:bg-papel-elevado"
                        >
                          {restantes + 1} más
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
