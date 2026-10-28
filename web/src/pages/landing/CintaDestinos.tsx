import type { CSSProperties } from 'react'
import { Pin } from '../../components/marca/Pin'
import type { TonoPinz } from '../../pinz/elenco'

const TONOS: TonoPinz[] = ['sol', 'mar', 'lavanda', 'coral', 'cielo']

const ARRIBA = ['París', 'Tokio', 'Nueva York', 'Roma', 'Barcelona', 'Río de Janeiro', 'Ciudad de México', 'Lisboa', 'Bangkok', 'Ámsterdam', 'Londres', 'Cusco', 'Marrakech', 'Sídney']
const ABAJO = ['Berlín', 'Cartagena', 'Kioto', 'Atenas', 'Florianópolis', 'Estambul', 'Praga', 'Machu Picchu', 'Seúl', 'Dubrovnik', 'Santorini', 'Bali']

type CintaProps = {
  destinos: string[]
  className: string
  giro: number
  /** Cuánto tarda en dar media vuelta y hacia dónde va. */
  animacion: CSSProperties
}

/* La lista va dos veces seguidas: la cinta se corre media vuelta y empieza de nuevo sin salto. */
function Cinta({ destinos, className, giro, animacion }: CintaProps) {
  return (
    <div className={`absolute -inset-x-20 -translate-y-1/2 overflow-hidden trazo-grueso-t trazo-grueso-b shadow-cinta ${className}`} style={{ rotate: `${giro}deg` }}>
      <div className="flex w-max motion-safe:animate-cinta hover:pausada" style={animacion}>
        {[0, 1].map((vuelta) => (
          <ul
            key={vuelta}
            aria-hidden={vuelta === 1}
            className="flex items-center gap-5 py-2.5 pr-5 font-display text-titulo-1 font-black whitespace-nowrap lg:gap-7.5 lg:py-3.5 lg:pr-7.5 lg:text-display"
          >
            {destinos.map((destino, i) => (
              <li key={destino} className="flex items-center gap-5 lg:gap-7.5">
                {destino}
                <Pin color={TONOS[(vuelta * destinos.length + i) % TONOS.length]} size={46} label="" className="max-lg:size-8" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/** Dos cintas cruzadas que van en sentidos opuestos. El camino pasa por detrás. */
export function CintaDestinos() {
  return (
    <section aria-label="Destinos" className="relative z-10 h-42.5 lg:h-65">
      <Cinta destinos={ARRIBA} className="top-2/5 z-10 bg-papel-elevado" giro={-3} animacion={{ animationDuration: '46s' }} />
      <Cinta destinos={ABAJO} className="top-31/50 bg-sol" giro={2.5} animacion={{ animationDuration: '58s', animationDirection: 'reverse' }} />
    </section>
  )
}
