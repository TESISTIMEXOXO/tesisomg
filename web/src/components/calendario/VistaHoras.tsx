import { Check, MapPin, Plus } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Cinta } from './Cinta'
import type { ActividadCalendario, TramoCalendario } from './tipos'
import { TONOS, acomodar, cintasDeLaFila, diaDeLaSemanaCorto, diaDelMes, diaDelViaje, fechaLarga, finDe, horaDe, minutos, porFecha } from './utilidades'

type VistaHorasProps = {
  /** Un día (vista Día) o siete (vista Semana). */
  dias: string[]
  hoy: string
  /** "AAAA-MM-DDTHH:MM" en la hora del destino, para la línea de ahora. */
  ahora: string | null
  actividades: ActividadCalendario[]
  tramos: TramoCalendario[]
  onAbrirDia?: (fecha: string) => void
  onAbrirActividad?: (actividad: ActividadCalendario) => void
  /** Sin esto (solo lectura), los horarios vacíos no se pueden tocar. */
  onCrear?: (fecha: string, hora: string) => void
}

const ALTO_HORA = 56
const POR_MINUTO = ALTO_HORA / 60
const HORAS = Array.from({ length: 24 }, (_, hora) => hora)
const GUIA = '3.5rem'
const LINEA = 19
const LINEAS: Record<number, string> = { 1: 'line-clamp-1', 2: 'line-clamp-2', 3: 'line-clamp-3' }

/** La grilla de horas, como la semana de Google Calendar: cada actividad es un bloque del alto de lo que dura. */
export function VistaHoras({ dias, hoy, ahora, actividades, tramos, onAbrirDia, onAbrirActividad, onCrear }: VistaHorasProps) {
  const scroll = useRef<HTMLDivElement>(null)
  const visibles = actividades.filter((actividad) => dias.includes(actividad.fecha))
  const { cintas, carriles } = cintasDeLaFila(tramos, dias)
  const unDia = dias.length === 1
  const columnas = `${GUIA} repeat(${dias.length}, minmax(0, 1fr))`
  const [fechaAhora, horaAhora] = ahora?.split('T') ?? []
  const minutoAhora = horaAhora ? minutos(horaAhora) : null

  /* Arranca una hora antes de lo primero que hay (o a las 8), así no se abre en la madrugada vacía. */
  const primera = Math.min(...visibles.map((actividad) => minutos(actividad.hora)), 9 * 60)
  const clave = dias.join()
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = Math.max(0, (primera - 60) * POR_MINUTO)
  }, [clave, primera])

  return (
    <div className="relative isolate">
      <div ref={scroll} className="max-h-[min(720px,78vh)] overflow-y-auto overscroll-contain" tabIndex={-1}>
        <div className="sticky top-0 z-30 bg-papel-elevado">
          <div className="grid trazo-b bg-papel-hundido" style={{ gridTemplateColumns: columnas }}>
            <span aria-hidden />
            {dias.map((dia) => {
              const esHoy = dia === hoy
              const enElViaje = diaDelViaje(tramos, dia)
              const contenido = (
                <>
                  <span className={`text-sobretitulo uppercase ${esHoy ? 'text-tinta' : 'text-tinta-suave'}`}>{diaDeLaSemanaCorto(dia)}</span>
                  <span className={`grid size-10 place-items-center rounded-full font-display text-titulo-2 font-black numeros ${esHoy ? 'bg-tinta text-papel' : ''}`}>
                    {diaDelMes(dia)}
                  </span>
                  <span className={`text-meta text-tinta-suave ${enElViaje ? '' : 'invisible'}`}>
                    {enElViaje ? `Día ${enElViaje.numero} de ${enElViaje.total}` : '·'}
                  </span>
                </>
              )
              return onAbrirDia && !unDia ? (
                <button
                  key={dia}
                  type="button"
                  onClick={() => onAbrirDia(dia)}
                  aria-label={`Ver ${fechaLarga(dia)}`}
                  aria-current={esHoy ? 'date' : undefined}
                  className="flex flex-col items-center gap-0.5 py-2.5 hover:bg-papel"
                >
                  {contenido}
                </button>
              ) : (
                <div key={dia} className={`flex gap-0.5 py-2.5 ${unDia ? 'flex-row items-center gap-3 px-3' : 'flex-col items-center'}`}>
                  {contenido}
                </div>
              )
            })}
          </div>

          {carriles > 0 && (
            <div className="grid trazo-b py-1.5" style={{ gridTemplateColumns: columnas, gridTemplateRows: `repeat(${carriles}, auto)` }}>
              <span className="self-center pr-2 text-right text-meta text-tinta-suave" style={{ gridColumn: 1, gridRow: '1 / -1' }}>
                Viaje
              </span>
              {cintas.map(({ tramo, desde, hasta, carril, sigueAntes, sigueDespues }) => (
                <Cinta
                  key={tramo.id}
                  tramo={tramo}
                  sigueAntes={sigueAntes}
                  sigueDespues={sigueDespues}
                  style={{ gridColumn: `${desde + 2} / ${hasta + 3}`, gridRow: carril + 1 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative grid" style={{ gridTemplateColumns: columnas, height: ALTO_HORA * 24 }}>
          <div aria-hidden className="relative">
            {HORAS.slice(1).map((hora) => (
              <span key={hora} className="absolute right-2 -translate-y-1/2 text-meta text-tinta-suave numeros" style={{ top: hora * ALTO_HORA }}>
                {horaDe(hora * 60)}
              </span>
            ))}
            {minutoAhora !== null && dias.includes(fechaAhora ?? '') && (
              <span
                className="absolute right-1 z-20 -translate-y-1/2 rounded-full bg-tinta px-1.5 py-px text-meta font-extrabold text-papel numeros"
                style={{ top: minutoAhora * POR_MINUTO }}
              >
                {horaAhora}
              </span>
            )}
          </div>

          {dias.map((dia) => {
            const ubicadas = acomodar(porFecha(visibles, dia))
            const esHoy = dia === fechaAhora
            return (
              <div
                key={dia}
                role="group"
                aria-label={fechaLarga(dia)}
                className={`relative border-l-2 border-linea ${dia === hoy ? 'bg-sol/12 oscuro:bg-sol/7' : ''}`}
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--linea) 0 2px, transparent 2px ${ALTO_HORA}px)`,
                }}
              >
                {onCrear &&
                  HORAS.map((hora) => (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => onCrear(dia, horaDe(hora * 60))}
                      aria-label={`Agregar actividad el ${fechaLarga(dia)} a las ${horaDe(hora * 60)}`}
                      className="group absolute inset-x-0 z-0 px-1 py-0.5"
                      style={{ top: hora * ALTO_HORA, height: ALTO_HORA }}
                    >
                      <span className="hidden h-full items-center gap-1 rounded-[10px] border-2 border-dashed px-2 text-meta font-extrabold text-tinta-suave group-hover:flex group-focus-visible:flex">
                        <Plus size={14} strokeWidth={3} aria-hidden />
                        {horaDe(hora * 60)}
                      </span>
                    </button>
                  ))}

                {ubicadas.map(({ actividad, columna, columnas: total }) => (
                  <Bloque
                    key={actividad.id}
                    actividad={actividad}
                    ancho={unDia}
                    estrecho={!unDia && total > 1}
                    onAbrir={onAbrirActividad}
                    style={{
                      top: minutos(actividad.hora) * POR_MINUTO + 1,
                      height: Math.max((finDe(actividad) - minutos(actividad.hora)) * POR_MINUTO - 3, 24),
                      /* Como en Google: cuando se pisan, cada una se corre a la derecha y queda arriba de la anterior, sin achicarse tanto. */
                      left: `calc(${(columna / total) * 100}% + 3px)`,
                      width: `calc(${columna === total - 1 ? 100 - (columna / total) * 100 : Math.min(100 - (columna / total) * 100, (100 / total) * 1.7)}% - 6px)`,
                      zIndex: 10 + columna,
                    }}
                  />
                ))}

                {esHoy && minutoAhora !== null && (
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: minutoAhora * POR_MINUTO }}>
                    <span className="-ml-1.5 size-3 flex-none -translate-y-px rounded-full border-2 bg-coral" />
                    <span className="h-0.5 flex-1 -translate-y-px bg-tinta" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type BloqueProps = {
  actividad: ActividadCalendario
  /** En la vista Día hay lugar para el lugar y la hora de fin en la misma línea. */
  ancho: boolean
  /** Comparte la columna con otra actividad: solo entra la hora de inicio. */
  estrecho: boolean
  onAbrir?: (actividad: ActividadCalendario) => void
  style: CSSProperties
}

function Bloque({ actividad, ancho, estrecho, onAbrir, style }: BloqueProps) {
  const corto = Number(style.height) < 50
  const rango = `${actividad.hora} – ${horaDe(finDe(actividad))}`
  /* Cuántas líneas de título entran en el alto del bloque, y si sobra lugar para el lugar. */
  const disponible = Number(style.height) - 12 - 18
  const linea = ancho ? 21 : LINEA
  const conLugar = Boolean(actividad.lugar) && !estrecho && disponible >= linea * 2 + 18
  const lineas = Math.max(1, Math.min(3, Math.floor((disponible - (conLugar ? 18 : 0)) / linea)))
  const relleno = actividad.hecha
    ? 'bg-papel-hundido text-tinta-suave shadow-none'
    : `tema-claro ${TONOS[actividad.tono].lleno} ${actividad.ahora ? 'shadow-dura ring-3 ring-tinta ring-offset-0' : 'shadow-chica'}`

  return (
    <button
      type="button"
      onClick={() => onAbrir?.(actividad)}
      aria-label={`${actividad.titulo}, ${rango}${actividad.lugar ? `, ${actividad.lugar}` : ''}${actividad.hecha ? ', ya pasó' : ''}`}
      className={`absolute flex flex-col overflow-hidden rounded-[10px] trazo-fino px-2 text-left transition-[translate,box-shadow] duration-120 ease-rebote hover:z-[25]! hover:-translate-px motion-reduce:transition-none ${
        corto ? 'justify-center py-0' : 'py-1.5'
      } ${relleno}`}
      style={style}
    >
      {corto ? (
        <span className="flex min-w-0 items-center gap-1.5 text-meta">
          <span className="flex-none font-extrabold numeros">{actividad.hora}</span>
          <span className="truncate font-extrabold">{actividad.titulo}</span>
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1.5 text-meta font-extrabold numeros">
            {actividad.hecha && <Check size={13} strokeWidth={3} aria-hidden />}
            {estrecho ? actividad.hora : rango}
            {actividad.ahora && !estrecho && <span className="rounded-full bg-tinta px-1.5 text-sobretitulo text-papel uppercase">Ahora</span>}
          </span>
          <span className={`font-extrabold leading-tight ${ancho ? 'text-cuerpo' : 'text-etiqueta'} ${LINEAS[lineas]} [overflow-wrap:normal]`}>{actividad.titulo}</span>
          {conLugar && (
            <span className="mt-0.5 flex min-w-0 items-center gap-1 text-meta opacity-80">
              <MapPin size={13} strokeWidth={2.5} aria-hidden className="flex-none" />
              <span className="truncate">{actividad.lugar}</span>
            </span>
          )}
        </>
      )}
    </button>
  )
}
