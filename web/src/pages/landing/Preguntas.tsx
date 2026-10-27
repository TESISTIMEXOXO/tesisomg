import { ChevronDown } from 'lucide-react'
import { Banda, TituloBanda } from './Banda'

const PREGUNTAS = [
  {
    pregunta: '¿Pinz maneja la plata?',
    respuesta: 'No. Pinz calcula cuánto le toca a cada uno y a quién pagarle, y cada uno transfiere por su lado con el alias.',
  },
  {
    pregunta: '¿Tienen que registrarse todos?',
    respuesta: 'Para votar y cargar gastos, sí: se entra con Google o Apple en dos toques.',
  },
  {
    pregunta: '¿Funciona sin señal?',
    respuesta: 'Los documentos del viaje y el itinerario del día quedan guardados en el celu.',
  },
  // PENDIENTE: el equipo todavía no definió el modelo de precios. No inventar una respuesta.
  { pregunta: '¿Es gratis?', respuesta: null },
]

export function Preguntas() {
  return (
    <Banda id="preguntas" fondo="bg-papel-hundido" angosta className="flex flex-col gap-4">
      <TituloBanda className="mb-4">Preguntas</TituloBanda>
      {PREGUNTAS.map(({ pregunta, respuesta }, i) => (
        <details key={pregunta} open={i === 0} className="group rounded-lg trazo bg-papel-elevado px-5.5 py-4.5 shadow-dura">
          <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-titulo-2 [&::-webkit-details-marker]:hidden">
            {pregunta}
            <ChevronDown
              size={24}
              strokeWidth={2}
              aria-hidden
              className="flex-none transition-transform duration-250 ease-rebote group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          {respuesta ? (
            <p className="mt-2.5 text-cuerpo-lg font-semibold">{respuesta}</p>
          ) : (
            <p className="mt-2.5 rounded-md border-2 border-dashed bg-sol-tinte px-4 py-3 font-semibold">
              Respuesta pendiente: falta definir el modelo de precios.
            </p>
          )}
        </details>
      ))}
    </Banda>
  )
}
