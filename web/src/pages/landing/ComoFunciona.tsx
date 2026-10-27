import type { CSSProperties } from 'react'
import { Pin } from '../../components/marca/Pin'
import { Banda, TituloBanda } from './Banda'

const PASOS = [
  { titulo: 'Armás el viaje', texto: 'Destino y fechas, o "todavía no sabemos". En un minuto.', fondo: 'bg-sol' },
  { titulo: 'Sumás a los pinz', texto: 'Con un link, un código o un QR. Cada uno elige su pinz.', fondo: 'bg-mar' },
  { titulo: 'Deciden y viajan', texto: 'Votan, se reparten las tareas y salen. Las cuentas se hacen solas.', fondo: 'bg-lavanda' },
]

export function ComoFunciona() {
  return (
    <Banda id="como" fondo="bg-mar-tinte" className="flex flex-col gap-10">
      <TituloBanda>Así de fácil.</TituloBanda>
      <div aria-hidden className="@container relative h-17.5">
        <svg width="100%" height="70" viewBox="0 0 1000 70" preserveAspectRatio="none">
          <path d="M10 52 H 990" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 14" className="stroke-tinta" />
        </svg>
        {/* El pin recorre la línea de punta a punta: --d es el largo del camino. */}
        <span className="absolute -top-1.5 left-0 motion-safe:animate-camina" style={{ '--d': 'calc(100cqw - 72px)' } as CSSProperties}>
          <Pin pinz="cumbre" size={72} label="" />
        </span>
      </div>
      <ol className="flex flex-col gap-7 lg:flex-row">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="flex flex-1 flex-col gap-3 rounded-lg trazo-grueso bg-papel-elevado p-7 shadow-grande">
            <span className={`grid size-14 place-items-center rounded-full trazo-grueso font-display text-titulo-1 font-black ${paso.fondo}`}>
              {i + 1}
            </span>
            <h3 className="font-display text-titulo-1 font-black">{paso.titulo}</h3>
            <p className="text-cuerpo-lg font-semibold">{paso.texto}</p>
          </li>
        ))}
      </ol>
    </Banda>
  )
}
