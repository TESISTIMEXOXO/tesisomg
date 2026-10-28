import type { ReactNode } from 'react'
import { Pin } from '../../components/marca/Pin'
import { BalanceRow } from '../../components/ui/BalanceRow'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { PollOption } from '../../components/ui/PollOption'
import type { PinzId } from '../../pinz/elenco'
import { Bajada, Seccion, Sobretitulo, TARJETA, Titular } from './Seccion'
import { inclinado } from './movimiento'

type CardProps = {
  sobretitulo: string
  titulo: string
  texto: ReactNode
  /** Fondo y lugar en la grilla. */
  className: string
  /** El ancla del camino, para las cards entre las que cruza. */
  ancla?: string
  children: ReactNode
}

function Card({ sobretitulo, titulo, texto, className, ancla, children }: CardProps) {
  return (
    <article
      data-camino={ancla}
      className={`relative flex flex-col gap-3 p-5 transition-transform duration-200 ease-rebote motion-reduce:transition-none lg:gap-4 lg:p-7 lg:hover:-translate-y-1.5 lg:hover:-rotate-2 ${TARJETA} ${className}`}
    >
      <Sobretitulo>{sobretitulo}</Sobretitulo>
      <div>
        <h3 className="max-w-62.5 font-display text-titulo-1 font-black text-balance lg:max-w-none lg:text-display lg:tracking-marca">{titulo}</h3>
        <p className="mt-2 max-w-105 text-etiqueta font-semibold text-pretty text-tinta-suave lg:mt-2.5 lg:text-cuerpo-lg">{texto}</p>
      </div>
      {children}
    </article>
  )
}

/** Un pinz que flota asomado sobre la esquina de arriba de una card. */
function Asoma({ pinz, grados, size, className = '-top-7.5 -right-2.5 lg:-top-9 lg:-right-6' }: { pinz: PinzId; grados: number; size: number; className?: string }) {
  return (
    <span className={`absolute motion-safe:animate-bob ${className}`} style={inclinado(grados)}>
      <Pin pinz={pinz} size={size} label="" className="max-lg:size-20" />
    </span>
  )
}

const DOCUMENTOS = ['Pasajes', 'Voucher cabaña', 'Seguro', 'DNI de todos', 'Reserva auto']

const PARADAS = [
  { numero: 1, nombre: 'Cabaña', x: 96, y: 214, fondo: 'bg-papel-elevado' },
  { numero: 2, nombre: 'Aerosilla', x: 380, y: 140, fondo: 'bg-sol' },
  { numero: 3, nombre: 'Refugio Lynch', x: 590, y: 104, fondo: 'bg-papel-elevado' },
]

const EN_EL_MAPA: { nombre: string; pinz: PinzId; x: number; y: number; size: number; grados: number }[] = [
  { nombre: 'Santi', pinz: 'siesta', x: 64, y: 112, size: 64, grados: -4 },
  { nombre: 'Fede', pinz: 'brujula', x: 300, y: 30, size: 70, grados: 3 },
  { nombre: 'Tomi', pinz: 'cumbre', x: 392, y: 32, size: 70, grados: -3 },
  { nombre: 'Juan Cruz', pinz: 'trasnoche', x: 520, y: 148, size: 64, grados: 4 },
]

const RUTA = 'M-10 214 C 160 214, 220 140, 380 140 S 600 92, 750 92'
/* Las paradas y los pinz se ubican en el sistema del dibujo (740 × 300) y se pasan a porcentaje para que el mapa se estire. */
const ANCHO_MAPA = 740
const ALTO_MAPA = 300
const enMapa = (x: number, y: number) => ({ left: `${(x / ANCHO_MAPA) * 100}%`, top: `${(y / ALTO_MAPA) * 100}%` })

/** El mapa simple de la card de Hoy: una ruta, tres paradas y el grupo, cada uno con su pinz y su nombre. */
function MapaSimple() {
  return (
    <div className="relative aspect-74/30 min-w-0 flex-1 overflow-hidden rounded-md trazo bg-cielo-tinte">
      <svg width="100%" height="100%" viewBox={`0 0 ${ANCHO_MAPA} ${ALTO_MAPA}`} aria-hidden className="absolute inset-0">
        <path d={RUTA} fill="none" strokeWidth="22" strokeLinecap="round" className="stroke-contorno" />
        <path d={RUTA} fill="none" strokeWidth="15" strokeLinecap="round" className="stroke-papel-elevado" />
        <path d={RUTA} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 12" className="stroke-coral" />
      </svg>
      <ol aria-label="Paradas de hoy">
        {PARADAS.map((parada) => (
          <li key={parada.numero} className="absolute flex -translate-3.75 items-center gap-1.5" style={enMapa(parada.x, parada.y)}>
            <span className={`grid size-7.5 place-items-center rounded-full trazo font-display text-meta font-black ${parada.fondo}`}>{parada.numero}</span>
            <span className="rounded-sm trazo-fino bg-papel px-1.5 text-meta font-extrabold whitespace-nowrap">{parada.nombre}</span>
          </li>
        ))}
      </ol>
      <ul aria-label="Dónde anda cada uno">
        {EN_EL_MAPA.map((persona) => (
          <li key={persona.nombre} className="absolute flex flex-col items-center" style={{ ...enMapa(persona.x, persona.y), rotate: `${persona.grados}deg` }}>
            <Pin pinz={persona.pinz} size={persona.size} label="" />
            <span className="relative -mt-3.5 rounded-full trazo bg-papel-elevado px-2.5 text-meta font-extrabold whitespace-nowrap shadow-chica">{persona.nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "Todo el viaje, ordenado.": el bento con lo que hace la app. En mobile no va la card de Hoy. */
export function Funciones() {
  return (
    <Seccion id="todo" className="py-5 lg:pt-10 lg:pb-15">
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <Titular>Todo el viaje, ordenado.</Titular>
        <Bajada className="lg:mb-2.5">Votaciones, plan, papeles y cuentas: cada cosa en su lugar y a la vista de todo el grupo.</Bajada>
      </div>
      <div className="mt-8 grid gap-5.5 lg:mt-15 lg:grid-cols-3 lg:gap-7">
        <Card sobretitulo="Votaciones" titulo="Votan todos, gana uno." texto="La opción ganadora pasa sola al plan." className="bg-sol-tinte lg:col-span-2">
          <div className="flex max-w-140 flex-col gap-2 barras-se-llenan">
            <PollOption label="Cabaña Los Coihues" detail="Fede, Tomi y Pedro" votes={3} total={6} disabled />
            <PollOption label="Hostel del Lago" detail="Juan Cruz" votes={1} total={6} disabled />
          </div>
          <Asoma pinz="chispa" grados={6} size={150} className="-top-7.5 -right-2.5 lg:top-15 lg:right-7.5" />
        </Card>
        <Card
          sobretitulo="Gastos"
          titulo="Cuentas claras."
          texto={
            <>
              <span className="lg:hidden">Cargás el gasto, elegís cómo dividirlo y Pinz te dice quién le paga a quién.</span>
              <span className="max-lg:hidden">Cargás el gasto, elegís si va en partes iguales o por consumo y Pinz te dice quién le paga a quién.</span>
            </>
          }
          className="bg-lavanda-tinte lg:row-span-2"
        >
          <div className="flex flex-col gap-2">
            <BalanceRow name="Fede" pinz="brujula" amount={-12400} />
            <BalanceRow name="Tomi" pinz="cumbre" amount={8150} />
            <div className="max-lg:hidden">
              <BalanceRow name="Santi" pinz="siesta" amount={0} />
            </div>
          </div>
          <span className="mt-auto self-center max-lg:hidden motion-safe:animate-repisa">
            <Pin pinz="vuelto" size={170} label="" />
          </span>
          <Asoma pinz="vuelto" grados={-6} size={84} className="-top-7.5 -right-2.5 lg:hidden" />
        </Card>
        <Card ancla="b-iti" sobretitulo="Plan" titulo="Día por día." texto="El itinerario del grupo, con aviso si dos planes se pisan." className="bg-papel-elevado">
          <ol>
            <ItineraryItem time="09:40" title="Salida a la aerosilla" place="Base Cerro Catedral" done />
            <ItineraryItem time="13:30" title="Almuerzo en el refugio" place="Refugio Lynch" current last />
          </ol>
          <Asoma pinz="brujula" grados={10} size={96} />
        </Card>
        <Card sobretitulo="Baúl" titulo="Los papeles, a mano." texto="Pasajes, vouchers y seguros, también sin señal." className="bg-coral-tinte">
          <ul className="flex flex-wrap gap-2">
            {DOCUMENTOS.map((documento) => (
              <li key={documento} className="rounded-full trazo bg-papel-elevado px-3.5 py-2 text-meta font-extrabold lg:text-etiqueta">
                {documento}
              </li>
            ))}
          </ul>
          <Asoma pinz="valija" grados={-8} size={96} />
        </Card>
        <Card
          ancla="b-hoy"
          sobretitulo="Durante el viaje"
          titulo="Qué toca hoy y dónde anda cada uno."
          texto="El plan del día y el grupo en el mapa, sin preguntar por el chat."
          className="bg-mar-tinte max-lg:hidden lg:col-span-3"
        >
          <div className="flex items-center gap-7">
            <ol className="w-80 flex-none">
              <ItineraryItem time="09:40" title="Salida a la aerosilla" place="Base Cerro Catedral" done />
              <ItineraryItem time="10:00" title="Subida al cerro" place="Aerosilla" current />
              <ItineraryItem time="13:30" title="Almuerzo en el refugio" place="Refugio Lynch" last />
            </ol>
            <MapaSimple />
          </div>
        </Card>
      </div>
    </Seccion>
  )
}
