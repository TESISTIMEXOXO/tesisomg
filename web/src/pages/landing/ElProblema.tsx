import { Check } from 'lucide-react'
import { Logo } from '../../components/marca/Logo'
import { Pin } from '../../components/marca/Pin'
import { Seccion, Sobretitulo, TARJETA, Titular } from './Seccion'
import { inclinado } from './movimiento'

const MENSAJES = [
  { quien: 'Santi', texto: '¿quién reservaba la cabaña al final?', estilo: 'self-start rounded-bl-sm bg-papel-elevado -rotate-2' },
  { quien: 'Pedro', texto: 'te paso el alias… ¿cuánto era?', estilo: 'self-end rounded-br-sm bg-coral-tinte rotate-2' },
  { quien: 'Tomi', texto: 'no leí nada, ¿salimos el 14 o el 15?', estilo: 'self-start rounded-bl-sm bg-papel-elevado -rotate-1' },
  { quien: 'Juan Cruz', texto: '¿alguien tiene el voucher?', estilo: 'self-end rounded-br-sm bg-papel-elevado rotate-3' },
]

const RESUELTO = [
  { texto: 'Alojamiento: Cabaña Los Coihues', fondo: 'bg-sol' },
  { texto: 'Salen el 14 a las 7:30', fondo: 'bg-mar' },
  { texto: 'Te falta poner $ 12.400 con Fede', fondo: 'bg-coral' },
  { texto: 'Vouchers guardados en el Baúl', fondo: 'bg-lavanda' },
]

function ChatGrupal() {
  return (
    <div className={`relative -rotate-2 lg:flex-1 ${TARJETA} bg-papel-hundido p-4.5 lg:p-7`}>
      <Sobretitulo className="text-tinta-suave">Chat grupal</Sobretitulo>
      <div className="mt-3 flex flex-col gap-2.5 lg:mt-4 lg:gap-3">
        {MENSAJES.map((mensaje) => (
          <p key={mensaje.quien} className={`max-w-62.5 rounded-md trazo px-3.5 py-2.5 text-etiqueta font-semibold lg:max-w-67.5 lg:text-cuerpo ${mensaje.estilo}`}>
            <b>{mensaje.quien}:</b> {mensaje.texto}
          </p>
        ))}
      </div>
      <span className="absolute -top-4.5 -right-2 rotate-8 rounded-full trazo bg-coral px-2.5 py-1 text-meta font-extrabold shadow-dura lg:-top-5.5 lg:-right-4.5 lg:px-3.5 lg:py-2 lg:text-cuerpo">
        +287 sin leer
      </span>
    </div>
  )
}

function TodoEnPinz() {
  return (
    <div className={`relative lg:flex-1 ${TARJETA} bg-papel-elevado p-4.5 lg:p-7`} style={{ rotate: '1.5deg' }}>
      <Logo size={24} className="lg:hidden" />
      <Logo size={30} className="max-lg:hidden" />
      <ul className="mt-3 flex flex-col gap-2 lg:mt-4 lg:gap-2.5">
        {RESUELTO.map((item) => (
          <li key={item.texto} className="flex items-center gap-3 rounded-md trazo bg-papel-elevado px-3.5 py-3 text-etiqueta font-bold lg:text-cuerpo-lg">
            <span className={`grid size-7.5 flex-none place-items-center rounded-full trazo ${item.fondo}`}>
              <Check size={16} strokeWidth={2} aria-hidden />
            </span>
            {item.texto}
          </li>
        ))}
      </ul>
      <span className="absolute -right-3.5 -bottom-10 motion-safe:animate-bob lg:-right-10 lg:-bottom-12.5" style={inclinado(8)}>
        <Pin pinz="chispa" size={120} label="" className="max-lg:size-21" />
      </span>
    </div>
  )
}

/** De un chat que nadie lee a los pendientes resueltos en Pinz. */
export function ElProblema() {
  return (
    <Seccion className="pt-17.5 pb-5 lg:pt-30 lg:pb-10">
      <Titular className="text-center">Del caos del chat a un solo lugar.</Titular>
      <div className="mt-10 flex flex-col lg:mt-17.5 lg:flex-row lg:items-center">
        <ChatGrupal />
        <svg viewBox="0 0 120 70" aria-hidden className="mx-auto my-4.5 h-17.5 w-15 flex-none rotate-90 lg:my-0 lg:w-30 lg:rotate-0">
          <path d="M10 35 H96 M74 10 L104 35 L74 60" fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="stroke-contorno" />
        </svg>
        <TodoEnPinz />
      </div>
    </Seccion>
  )
}
