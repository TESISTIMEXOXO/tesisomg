import { ArrowLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaminosDeLaVentana } from '../../components/marca/CaminosDeLaVentana'
import { Pin } from '../../components/marca/Pin'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Ventana } from '../../components/ui/Ventana'
import { recordarPinzDelTest } from '../../lib/pinzDelTest'
import { ELENCO, type PinzId } from '../../pinz/elenco'
import { calcularPinz, PREGUNTAS, type Opcion } from '../../pinz/test'
import { FONDO_TINTE } from '../../pinz/tonos'

/** "¿Qué pinz sos?": tres preguntas, sin cuenta. Es una Ventana sobre la landing, como el ingreso. */
export function TestPinz() {
  const [respuestas, setRespuestas] = useState<Opcion[]>([])
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const navigate = useNavigate()

  useEffect(() => {
    if (!ventana.current?.open) ventana.current?.showModal()
  }, [])

  const terminado = respuestas.length === PREGUNTAS.length

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={() => navigate('/')}>
      <CaminosDeLaVentana />
      <div className="relative flex flex-col gap-6">
        <h1 id={idTitulo} className="pr-24 font-display text-titulo-1 font-black">
          ¿Qué pinz sos?
        </h1>
        {terminado ? (
          <Resultado pinz={calcularPinz(respuestas)} onRepetir={() => setRespuestas([])} />
        ) : (
          <PasoPregunta
            numero={respuestas.length}
            onResponder={(opcion) => setRespuestas([...respuestas, opcion])}
            onVolver={() => setRespuestas(respuestas.slice(0, -1))}
          />
        )}
      </div>
    </Ventana>
  )
}

type PasoPreguntaProps = {
  numero: number
  onResponder: (opcion: Opcion) => void
  onVolver: () => void
}

function PasoPregunta({ numero, onResponder, onVolver }: PasoPreguntaProps) {
  const pregunta = PREGUNTAS[numero]
  const titulo = useRef<HTMLHeadingElement>(null)

  // La opción tocada desaparece al avanzar: el foco pasa a la pregunta nueva para que el lector la anuncie.
  useEffect(() => {
    if (numero > 0) titulo.current?.focus()
  }, [numero])

  if (!pregunta) return null

  return (
    <section aria-labelledby={`pregunta-${numero}`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-meta font-bold text-tinta-suave">
          Pregunta {numero + 1} de {PREGUNTAS.length}
        </p>
        <h2 ref={titulo} id={`pregunta-${numero}`} tabIndex={-1} className="font-display text-titulo-2 font-black outline-none">
          {pregunta.texto}
        </h2>
      </div>
      <ul className="flex flex-col gap-3">
        {pregunta.opciones.map((opcion) => (
          <li key={opcion.texto}>
            <button
              type="button"
              onClick={() => onResponder(opcion)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md trazo bg-papel-elevado px-4 py-3 text-left font-semibold shadow-chica transition-[translate,box-shadow] duration-200 ease-rebote hover:-translate-y-0.5 hover:shadow-dura active:translate-0.5 active:shadow-none motion-reduce:transition-none"
            >
              {opcion.texto}
              <ChevronRight size={20} aria-hidden className="flex-none" />
            </button>
          </li>
        ))}
      </ul>
      {numero > 0 && (
        <Button variant="fantasma" icon={ArrowLeft} full onClick={onVolver}>
          Volver
        </Button>
      )}
    </section>
  )
}

function Resultado({ pinz, onRepetir }: { pinz: PinzId; onRepetir: () => void }) {
  const personaje = ELENCO[pinz]
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <section aria-labelledby="resultado-test" className="flex flex-col gap-5">
      <div className={`flex flex-col items-center rounded-lg trazo-grueso px-4 pt-2 pb-5 text-center shadow-dura ${FONDO_TINTE[personaje.tono]}`}>
        <Pin pinz={pinz} size={140} label="" className="motion-safe:animate-asoma" />
        <h2 ref={titulo} id="resultado-test" tabIndex={-1} className="font-display text-titulo-1 font-black outline-none">
          Sos {personaje.nombre}
        </h2>
        <p className="font-bold text-tinta-suave">{personaje.apodo}</p>
      </div>
      <p>{personaje.descripcion}</p>
      <blockquote className="font-display text-titulo-2 font-black">«{personaje.frase}»</blockquote>
      <div className="flex flex-col gap-3">
        <ButtonLink to="/ingresar" iconRight={ChevronRight} full onClick={() => recordarPinzDelTest(pinz)}>
          Quiero ser {personaje.nombre}
        </ButtonLink>
        <Button variant="fantasma" icon={RotateCcw} full onClick={onRepetir}>
          Hacerlo de nuevo
        </Button>
      </div>
    </section>
  )
}
