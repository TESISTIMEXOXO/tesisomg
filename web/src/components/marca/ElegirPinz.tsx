import { ELENCO, PINZ_IDS, type PinzId } from '../../pinz/elenco'
import { FONDO_TINTE } from '../../pinz/tonos'
import { Pin } from './Pin'

type ElegirPinzProps = {
  valor: PinzId | null
  onElegir: (pinz: PinzId) => void
  leyenda?: string
}

/**
 * La grilla para elegir personalidad. Es la única pantalla de la app donde los pinz van grandes.
 * Mide su propio ancho y no el de la pantalla: cinco por fila si entran, si no dos. Con diez, las filas siempre quedan parejas.
 */
export function ElegirPinz({ valor, onElegir, leyenda = 'Elegí tu pinz' }: ElegirPinzProps) {
  return (
    <fieldset className="@container">
      <legend className="mb-3 text-etiqueta">{leyenda}</legend>
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-5">
        {PINZ_IDS.map((pinz) => {
          const elegido = pinz === valor
          return (
            <label
              key={pinz}
              className={`flex cursor-pointer flex-col items-center rounded-lg trazo px-2 pt-1 pb-3 text-center transition-[translate,box-shadow] duration-200 ease-rebote has-focus-visible:outline-3 has-focus-visible:outline-offset-3 motion-reduce:transition-none ${
                elegido ? `translate-0.5 shadow-none ${FONDO_TINTE[ELENCO[pinz].tono]}` : 'bg-papel-elevado shadow-dura'
              }`}
            >
              <input type="radio" name="pinz" value={pinz} checked={elegido} onChange={() => onElegir(pinz)} className="sr-only" />
              <Pin pinz={pinz} size={96} label="" className={elegido ? 'motion-safe:animate-asoma' : ''} />
              <span className="font-display text-titulo-2 font-black">{ELENCO[pinz].nombre}</span>
              <span className="text-meta text-tinta-suave">{ELENCO[pinz].apodo}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
