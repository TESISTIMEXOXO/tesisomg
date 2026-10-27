import type { ReactNode } from 'react'
import { Pin } from '../../components/marca/Pin'
import { BalanceRow } from '../../components/ui/BalanceRow'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { PollOption } from '../../components/ui/PollOption'
import { Bajada, Sobretitulo } from './Banda'
import { inclinado } from './movimiento'

type FuncionProps = {
  sobretitulo: string
  titulo: string
  texto: string
  /** La ilustración va a la izquierda en desktop; en mobile siempre abajo del texto. */
  invertida?: boolean
  children: ReactNode
}

function Funcion({ sobretitulo, titulo, texto, invertida = false, children }: FuncionProps) {
  return (
    <div className={`flex flex-col gap-14 lg:items-center ${invertida ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      <div className="flex flex-1 flex-col gap-4">
        <Sobretitulo>{sobretitulo}</Sobretitulo>
        <h2 className="font-display text-display font-black text-balance">{titulo}</h2>
        <Bajada>{texto}</Bajada>
      </div>
      <div className="relative flex-1 pt-12 lg:pt-0">{children}</div>
    </div>
  )
}

/** Un pinz con su globito de texto, asomado sobre la esquina de una tarjeta. */
function PinzQueDice({ texto, children, className }: { texto: string; children: ReactNode; className: string }) {
  return (
    <div className={`absolute z-10 flex items-start gap-1.5 ${className}`}>
      {children}
      <span className="mt-1 rounded-md trazo-fino bg-papel-elevado px-3 py-1 text-meta font-extrabold whitespace-nowrap shadow-chica">
        {texto}
      </span>
    </div>
  )
}

const TARJETA = 'relative flex flex-col gap-2.5 rounded-lg trazo-grueso p-5 shadow-grande md:p-7'

export function Funciones() {
  return (
    <section id="funciones" className="scroll-mt-20 trazo-grueso-t bg-papel">
      <div className="mx-auto flex max-w-310 flex-col gap-24 px-4 py-20 md:px-6 lg:py-22">
        <Funcion
          sobretitulo="Votaciones"
          titulo="Lo que gana, pasa al plan solo."
          texto="Propongan opciones, voten y vean qué pinz falta. Nadie copia nada a mano."
        >
          <div className={`${TARJETA} bg-sol-tinte`}>
            <PinzQueDice texto="¿Cabaña o hostel?" className="-top-14.5 left-0 lg:-left-8.5">
              <span className="motion-safe:animate-bob" style={inclinado(-8)}>
                <Pin pinz="chispa" size={84} label="" />
              </span>
            </PinzQueDice>
            <PollOption label="Cabaña Los Coihues" detail="$ 38.000 la noche · Fede, Tomi y Pedro" votes={3} total={6} disabled />
            <PollOption label="Hostel del Lago" detail="$ 22.000 la noche · Juan Cruz" votes={1} total={6} disabled />
            <PollOption label="Depto. en Melipal" detail="$ 31.000 la noche" votes={0} total={6} disabled />
          </div>
        </Funcion>

        <Funcion
          invertida
          sobretitulo="Gastos"
          titulo="Sacale foto al ticket. Pinz hace las cuentas."
          texto="Partes iguales o por consumo, con propina. Y al final, quién le paga a quién, sin culpas."
        >
          <div className={`${TARJETA} bg-lavanda-tinte`}>
            <PinzQueDice texto="Yo hago las cuentas" className="-top-15 right-0 flex-row-reverse lg:-right-6">
              <span className="motion-safe:animate-bob" style={inclinado(8, -1.2)}>
                <Pin pinz="vuelto" size={84} label="" />
              </span>
            </PinzQueDice>
            <BalanceRow name="Fede" pinz="brujula" amount={-12400} />
            <BalanceRow name="Tomi" pinz="cumbre" amount={8150} />
            <BalanceRow name="Santi" pinz="siesta" amount={0} />
          </div>
        </Funcion>

        <Funcion
          sobretitulo="Durante el viaje"
          titulo="Qué hacemos hoy y dónde está cada uno."
          texto="El día en el mapa, el voucher a mano aunque no haya señal y el grupo, pinz por pinz."
        >
          <div className="relative h-82.5 overflow-hidden rounded-lg trazo-grueso bg-cielo-tinte shadow-grande">
            <svg width="100%" height="100%" viewBox="0 0 580 330" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0">
              <path d="M-10 270 Q 120 236 250 262 T 590 250 L 590 340 L -10 340 Z" strokeWidth="3" className="fill-cielo stroke-tinta" />
              <path d="M62 196 C 150 150, 250 214, 340 156 S 450 92, 512 84" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 13" className="stroke-tinta" />
              <circle cx="56" cy="198" r="10" strokeWidth="3" className="fill-sol stroke-tinta" />
              <circle cx="520" cy="82" r="10" strokeWidth="3" className="fill-coral stroke-tinta" />
            </svg>
            <span className="absolute top-2/5 left-1/20 rounded-full trazo-fino bg-papel-elevado px-2.5 py-0.5 text-meta font-extrabold">Cabaña</span>
            <span className="absolute top-1/10 right-1/20 z-10 rounded-full trazo-fino bg-papel-elevado px-2.5 py-0.5 text-meta font-extrabold">Cerro Catedral</span>
            <span className="absolute top-1/20 left-16/25 motion-safe:animate-bob" style={inclinado(5)}>
              <Pin pinz="cumbre" size={84} label="" />
            </span>
            <span className="absolute top-1/5 left-9/20 motion-safe:animate-bob" style={inclinado(-5, -1)}>
              <Pin pinz="nono" size={76} label="" />
            </span>
            <span className="absolute top-3/10 left-1/5 motion-safe:animate-bob" style={inclinado(4, -2)}>
              <Pin pinz="trasnoche" size={64} label="" />
            </span>
            <ol className="absolute inset-x-5.5 bottom-1.5">
              <ItineraryItem time="10:00" title="Subida al Cerro Catedral" place="5 de 6 ya llegaron (Trasnoche viene en camino)" current last />
            </ol>
          </div>
        </Funcion>
      </div>
    </section>
  )
}
