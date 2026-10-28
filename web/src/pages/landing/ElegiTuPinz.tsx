import { ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Pin } from '../../components/marca/Pin'
import { ButtonLink } from '../../components/ui/Button'
import { ELENCO, PINZ_IDS } from '../../pinz/elenco'
import { FONDO_TINTE } from '../../pinz/tonos'
import { Seccion, Titular } from './Seccion'

/* Cada card va apenas girada. El patrón se repite por fila: tres columnas en mobile, cinco en desktop. */
const GIRO_MOBILE = [-2, 1.5, -1]
const GIRO_DESKTOP = [-2, 1.5, -1, 2, -1.5]

function HaceElTest({ className }: { className: string }) {
  return (
    <ButtonLink to="/ingresar" variant="secundario" iconRight={ChevronRight} className={className}>
      Hacé el test
    </ButtonLink>
  )
}

/**
 * "Cada uno, su pinz.": las diez personalidades. En mobile van nueve, sin Cumbre, para cerrar tres filas de tres.
 * Entre 1024 y 1280 las cinco columnas son angostas y los pinz se achican.
 */
export function ElegiTuPinz() {
  return (
    <Seccion id="tu-pinz" className="py-5 lg:flex lg:items-center lg:gap-15 lg:py-10">
      <div className="flex flex-col items-start gap-4 lg:w-105 lg:flex-none lg:gap-5.5">
        <Titular>Cada uno, su pinz.</Titular>
        <p className="text-cuerpo-lg font-semibold lg:text-bajada">
          Diez personalidades de viaje. Elegí la tuya o hacé el test de tres preguntas
          <span className="max-lg:hidden">: así te ve el grupo en cada votación, en cada gasto y en el mapa</span>.
        </p>
        <HaceElTest className="max-lg:hidden" />
      </div>
      <ul aria-label="Las diez personalidades" className="mt-6.5 grid grid-cols-3 gap-x-3 gap-y-3.5 lg:mt-0 lg:flex-1 lg:grid-cols-5 lg:gap-x-4.5 lg:gap-y-5.5">
        {PINZ_IDS.map((pinz, i) => {
          const personaje = ELENCO[pinz]
          return (
            <li
              key={pinz}
              className={`flex flex-col items-center rounded-lg trazo-grueso px-1 pt-0.5 pb-2.5 shadow-dura transition-transform duration-200 ease-rebote motion-reduce:transition-none lg:px-2.5 lg:pt-1.5 lg:pb-3.5 rotate-(--giro) lg:rotate-(--giro-lg) lg:hover:-translate-y-1.5 lg:hover:-rotate-2 ${
                FONDO_TINTE[personaje.tono]
              } ${pinz === 'cumbre' ? 'max-lg:hidden' : ''}`}
              style={{ '--giro': `${GIRO_MOBILE[i % 3]}deg`, '--giro-lg': `${GIRO_DESKTOP[i % 5]}deg` } as CSSProperties}
            >
              <Pin pinz={pinz} size={120} label="" className="max-lg:size-21 lg:max-xl:size-20" />
              <span className="-mt-1 font-display text-etiqueta font-black xl:-mt-1.5 xl:text-titulo-2">{personaje.nombre}</span>
              <span className="text-meta font-bold text-tinta-suave max-lg:hidden">{personaje.apodo}</span>
            </li>
          )
        })}
      </ul>
      <HaceElTest className="mt-5.5 w-full lg:hidden" />
    </Seccion>
  )
}
