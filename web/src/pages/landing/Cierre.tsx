import { ChevronRight } from 'lucide-react'
import { Pin } from '../../components/marca/Pin'
import { ButtonLink } from '../../components/ui/Button'
import type { PinzId } from '../../pinz/elenco'
import { inclinado } from './movimiento'

const GRUPO: { pinz: PinzId; size: number; grados: number }[] = [
  { pinz: 'morfi', size: 124, grados: -8 },
  { pinz: 'chispa', size: 168, grados: 0 },
  { pinz: 'trasnoche', size: 140, grados: 6 },
  { pinz: 'valija', size: 112, grados: 10 },
]

/** Los pinz saltan solos y, cuando el botón está en hover, saltan todos juntos. */
export function Cierre() {
  return (
    <section className="group/cierre trazo-grueso-t bg-coral">
      <div className="mx-auto flex max-w-310 flex-col gap-10 px-4 py-24 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-7 lg:max-w-170">
          <h2 className="font-display text-display font-black text-balance md:text-display-xl">
            Organizar el viaje también es parte del viaje.
          </h2>
          <div>
            <ButtonLink to="/ingresar" variant="secundario" iconRight={ChevronRight}>
              Armar un viaje
            </ButtonLink>
          </div>
        </div>
        <div aria-hidden className="flex items-end justify-center gap-1.5">
          {GRUPO.map(({ pinz, size, grados }, i) => (
            <span
              key={pinz}
              className="motion-safe:animate-jump group-has-[a:hover]/cierre:salto-rapido"
              style={inclinado(grados, -0.4 * i)}
            >
              <Pin pinz={pinz} size={size} label="" className="max-md:size-20" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
