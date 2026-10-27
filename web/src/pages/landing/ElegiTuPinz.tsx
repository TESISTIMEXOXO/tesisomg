import { useState } from 'react'
import { Pin } from '../../components/marca/Pin'
import { ELENCO, PINZ_IDS, type PinzId } from '../../pinz/elenco'
import { FONDO, FONDO_TINTE } from '../../pinz/tonos'
import { Banda, Sobretitulo, TituloBanda } from './Banda'
import { inclinado } from './movimiento'

/** La ficha corta del pinz elegido: nombre, apodo, qué es y su frase. */
function Ficha({ pinz }: { pinz: PinzId }) {
  const personaje = ELENCO[pinz]
  const numero = String(PINZ_IDS.indexOf(pinz) + 1).padStart(2, '0')
  const seccion = personaje.acompana.split(' · ')[0]
  return (
    <article
      aria-live="polite"
      className="flex flex-col gap-2.5 rounded-lg trazo-grueso bg-papel-elevado px-7 pt-5.5 pb-7 shadow-grande lg:w-100 lg:flex-none"
    >
      <span className={`self-start rounded-full trazo-fino px-3 py-1 text-sobretitulo uppercase ${FONDO[personaje.tono]}`}>
        {numero} · {seccion}
      </span>
      <div className={`flex justify-center rounded-lg trazo ${FONDO_TINTE[personaje.tono]}`}>
        <span key={pinz} className="motion-safe:animate-jump" style={inclinado(-4)}>
          <Pin pinz={pinz} size={250} label="" />
        </span>
      </div>
      <h3 className="font-display text-display font-black">{personaje.nombre}</h3>
      <p className="-mt-1.5 text-cuerpo-lg font-extrabold text-tinta-suave">{personaje.apodo}</p>
      <p className="font-semibold">{personaje.descripcion}</p>
      <p className={`mt-1 rounded-md rounded-bl-sm trazo-fino px-3.5 py-2.5 font-extrabold ${FONDO_TINTE[personaje.tono]}`}>
        «{personaje.frase}»
      </p>
    </article>
  )
}

export function ElegiTuPinz() {
  const [elegido, setElegido] = useState<PinzId>('vuelto')

  return (
    <Banda id="tu-pinz" fondo="bg-lavanda" className="flex flex-col gap-11">
      <div className="flex max-w-195 flex-col gap-3.5">
        <Sobretitulo>Tu pinz · diez personalidades de viaje</Sobretitulo>
        <TituloBanda>Cada uno, su pinz.</TituloBanda>
        <p className="text-cuerpo-lg font-semibold">
          Elegí tu personalidad o hacé el test de tres preguntas. Así te ve el grupo: en cada votación, en cada gasto y en el mapa.
        </p>
      </div>
      <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
        <Ficha pinz={elegido} />
        <ul aria-label="Las diez personalidades" className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {PINZ_IDS.map((pinz) => {
            const activo = pinz === elegido
            return (
              <li key={pinz}>
                <button
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setElegido(pinz)}
                  className={`group flex w-full flex-col items-center gap-0.5 rounded-lg trazo px-1.5 pt-1 pb-3 transition-[translate,box-shadow] duration-250 ease-rebote motion-reduce:transition-none ${
                    activo ? `translate-0.5 shadow-none ${FONDO_TINTE[ELENCO[pinz].tono]}` : 'bg-papel-elevado shadow-dura hover:-translate-y-1'
                  }`}
                >
                  <span
                    className={`transition-transform duration-250 ease-rebote motion-reduce:transition-none ${
                      activo ? 'scale-110' : 'group-hover:-translate-y-2.5 group-hover:-rotate-4 motion-reduce:group-hover:translate-0 motion-reduce:group-hover:rotate-0'
                    }`}
                  >
                    <Pin pinz={pinz} size={120} label="" />
                  </span>
                  <span className="font-display text-titulo-2 font-black">{ELENCO[pinz].nombre}</span>
                  <span className="text-meta font-bold text-tinta-suave">{ELENCO[pinz].apodo}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="self-center rounded-full trazo bg-papel-elevado px-6 py-3 text-center text-cuerpo-lg font-extrabold shadow-dura">
        Y el grupo muestra su mezcla: «dos madrugadores, un trasnoche y una precavida».
      </p>
    </Banda>
  )
}
