import { ChevronRight } from 'lucide-react'
import { Pin } from '../../components/marca/Pin'
import { ButtonLink } from '../../components/ui/Button'
import { PINZ_IDS } from '../../pinz/elenco'
import { Seccion } from './Seccion'
import { inclinado } from './movimiento'

const GIROS = [-6, 4, -3, 7, -5, 3, -7, 5, -2, 6]

/** El botón final, apoyado en la plataforma donde termina el camino, y la repisa con el elenco asomándose. */
export function Cierre() {
  return (
    <Seccion className="pt-7.5 text-center lg:pt-15">
      <h2 className="font-display text-cierre text-balance">
        Organizar el viaje <br className="max-lg:hidden" />
        también es parte <br className="max-lg:hidden" />
        del viaje.
      </h2>
      <div className="mt-8.5 mb-1.5 lg:mt-15 lg:mb-4">
        <span data-camino="cta" className="relative z-10 inline-block scale-120 lg:scale-145">
          <ButtonLink to="/ingresar" iconRight={ChevronRight}>
            Organizá tu viaje
          </ButtonLink>
        </span>
      </div>
      <div aria-hidden className="mt-14 flex h-18 items-start justify-center gap-0.5 overflow-hidden trazo-grueso-b lg:mt-22.5 lg:h-28">
        {PINZ_IDS.map((pinz, i) => (
          <span key={pinz} className={`motion-safe:animate-repisa ${i >= 5 ? 'max-lg:hidden' : ''}`} style={inclinado(GIROS[i], -0.3 * i)}>
            <Pin pinz={pinz} size={120} label="" className="max-lg:size-19" />
          </span>
        ))}
      </div>
    </Seccion>
  )
}
