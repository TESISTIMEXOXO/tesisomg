import { Pin } from '../../components/marca/Pin'
import { FormularioContacto } from './FormularioContacto'
import { Bajada, Seccion, TARJETA, Titular } from './Seccion'
import { inclinado } from './movimiento'

const PREGUNTAS = [
  {
    pregunta: '¿Pinz maneja la plata?',
    respuesta: 'No. Calcula cuánto le toca a cada uno y a quién pagarle; las transferencias las hace cada uno por su lado, con el alias.',
    giro: -1,
    signo: 'bg-sol -rotate-8',
  },
  {
    pregunta: '¿Tienen que registrarse todos?',
    respuesta: 'Para votar y cargar gastos, sí. Se entra con Google, Apple o el mail, sin crear otra contraseña.',
    giro: 0.8,
    signo: 'bg-mar rotate-6',
  },
  {
    pregunta: '¿Cómo sumo al grupo?',
    respuesta: 'Con un link, un código o un QR. Antes de entrar, cada uno ve a qué viaje se está sumando.',
    giro: 0.6,
    signo: 'bg-coral -rotate-5',
  },
  {
    pregunta: '¿Y si todavía no hay fechas?',
    respuesta: 'Armás el viaje igual y las fechas las deciden votando, como todo lo demás.',
    giro: -0.8,
    signo: 'bg-lavanda rotate-8',
  },
  {
    pregunta: '¿Funciona sin señal?',
    respuesta: 'Los papeles del viaje y el itinerario del día quedan guardados en el celu.',
    giro: -0.5,
    signo: 'bg-cielo -rotate-6',
  },
  // PENDIENTE: el equipo todavía no definió el modelo de precios. No inventar una respuesta.
  {
    pregunta: '¿Es gratis?',
    respuesta: '[Definir el modelo de precios]',
    giro: 1,
    signo: 'bg-durazno rotate-5',
  },
]

function Contacto() {
  return (
    <aside className={`relative flex flex-col items-start gap-3.5 bg-sol px-7 py-8 max-lg:order-last lg:w-85 lg:flex-none ${TARJETA}`}>
      <h3 className="font-display text-titulo-1 font-black lg:text-display lg:tracking-marca">¿Te quedó alguna duda?</h3>
      <p className="text-cuerpo-lg font-semibold">Escribinos y te respondemos.</p>
      <FormularioContacto />
      <span
        className="absolute right-2.5 -bottom-5 motion-safe:animate-bob lg:static lg:mt-auto lg:self-center"
        style={inclinado(-6)}
      >
        <Pin pinz="valija" size={190} label="" className="max-lg:size-25" />
      </span>
    </aside>
  )
}

/** "¿Dudas?": las preguntas, todas abiertas, y el bloque para escribirnos. En mobile el bloque va al final. */
export function Preguntas() {
  return (
    <Seccion id="preguntas" className="pt-17.5 pb-5 lg:pt-25 lg:pb-17.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <Titular>¿Dudas?</Titular>
        <Bajada className="lg:mb-3">Lo que más nos preguntan antes de armar el primer viaje.</Bajada>
      </div>
      <div className="mt-6.5 flex flex-col gap-6.5 lg:mt-14 lg:flex-row">
        <Contacto />
        <div className="grid flex-1 items-start gap-3.5 lg:grid-cols-2 lg:gap-6.5">
          {PREGUNTAS.map(({ pregunta, respuesta, giro, signo }) => (
            <article
              key={pregunta}
              className="flex items-start gap-3.5 rounded-lg trazo-grueso bg-papel-elevado px-4.5 py-4 shadow-dura lg:px-6.5 lg:py-6"
              style={{ rotate: `${giro}deg` }}
            >
              <span aria-hidden className={`grid size-9 flex-none place-items-center rounded-full trazo font-display text-titulo-2 font-black ${signo}`}>
                ?
              </span>
              <div>
                <h3 className="font-display text-titulo-2 font-black">{pregunta}</h3>
                <p className="mt-2 text-etiqueta font-semibold text-pretty lg:text-cuerpo-lg">{respuesta}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Seccion>
  )
}
