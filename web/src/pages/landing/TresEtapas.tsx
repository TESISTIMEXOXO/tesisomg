import { Pin } from '../../components/marca/Pin'
import type { PinzId } from '../../pinz/elenco'
import { Bajada, Seccion, Sobretitulo, Titular } from './Seccion'
import { inclinado } from './movimiento'

const ETAPAS: { nombre: string; momento: string; texto: string; fondo: string; pinz: PinzId; grados: number }[] = [
  {
    nombre: 'Previaje',
    momento: 'Antes de salir',
    texto: 'Votan destino y alojamiento, arman el itinerario y se reparten las tareas.',
    fondo: 'bg-sol',
    pinz: 'chispa',
    grados: -6,
  },
  {
    nombre: 'Viaje',
    momento: 'Mientras viajan',
    texto: 'El plan del día, el grupo en el mapa y los gastos cargados en el momento.',
    fondo: 'bg-mar',
    pinz: 'siesta',
    grados: 4,
  },
  {
    nombre: 'Post-viaje',
    momento: 'Al volver',
    texto: 'Las cuentas simplificadas para quedar a mano y los lugares que recorrieron.',
    fondo: 'bg-lavanda',
    pinz: 'postal',
    grados: -3,
  },
]

export function TresEtapas() {
  return (
    <Seccion id="etapas" className="py-5 lg:pt-10">
      <Titular className="lg:text-center">
        Pinz cambia <br className="max-lg:hidden" />
        con el viaje.
      </Titular>
      <Bajada className="mt-3.5 lg:mx-auto lg:mt-6 lg:max-w-140 lg:text-center lg:text-balance">
        Lo que ves en la app depende del momento del viaje en el que estén.
      </Bajada>
      <div className="relative mt-15 lg:mt-20 lg:pt-20.5">
        {/* Une los centros de los círculos. */}
        <svg viewBox="0 0 800 20" preserveAspectRatio="none" aria-hidden className="absolute inset-x-1/6 top-45.5 hidden h-5 lg:block">
          <path d="M0 10 H800" strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 16" className="stroke-contorno" />
        </svg>
        <ol className="flex flex-col gap-11 lg:grid lg:grid-cols-3 lg:gap-0">
          {ETAPAS.map((etapa, i) => (
            <li key={etapa.nombre} className="relative flex items-center gap-4.5 lg:flex-col lg:text-center">
              <div className={`relative grid size-27.5 flex-none place-items-center rounded-full trazo-grueso shadow-grande lg:size-55 ${etapa.fondo}`}>
                <span className="absolute -top-10 motion-safe:animate-jump lg:-top-20.5" style={inclinado(etapa.grados, -0.6 * i)}>
                  <Pin pinz={etapa.pinz} size={130} label="" className="max-lg:size-16" />
                </span>
                <span aria-hidden className="hidden px-2 font-display text-display tracking-marca lg:block">
                  {etapa.nombre}
                </span>
              </div>
              <div className="flex flex-col lg:items-center lg:gap-2">
                <Sobretitulo className="text-tinta-suave">{etapa.momento}</Sobretitulo>
                <h3 className="font-display text-titulo-1 font-black lg:sr-only">{etapa.nombre}</h3>
                <p className="mt-1.5 text-etiqueta font-semibold text-pretty lg:mt-0 lg:max-w-72.5 lg:text-cuerpo-lg lg:text-balance">{etapa.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Seccion>
  )
}
