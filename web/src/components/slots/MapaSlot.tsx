import type { Ref } from 'react'
import type { PuntoMapa, Ubicacion } from '../../types/itinerario'
import { AvatarStack } from '../ui/AvatarStack'
import { EsperaSlot } from './EsperaSlot'

export type MapaSlotProps = {
  puntos: PuntoMapa[]
  /** Quienes compartieron su ubicación. Se dibujan como avatar-pin en el tono de su pinz. */
  personas: Ubicacion[]
  onSeleccionarPunto?: (id: string) => void
  /** El elemento donde la librería de mapas que elija el equipo se monta. Tiene tamaño fijo. */
  contenedorRef?: Ref<HTMLDivElement>
  /** Alto del mapa: chico en Hoy, más grande en Plan. */
  alto?: 'chico' | 'grande'
  className?: string
}

/** Slot del mapa. Lo dibuja una librería de mapas que todavía no está en el stack. */
export function MapaSlot({ puntos, personas, onSeleccionarPunto, contenedorRef, alto = 'chico', className = '' }: MapaSlotProps) {
  return (
    <section
      aria-label="Mapa"
      className={`relative overflow-hidden rounded-lg trazo bg-cielo-tinte shadow-dura ${alto === 'chico' ? 'h-60' : 'h-90'} ${className}`}
    >
      <div ref={contenedorRef} className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <EsperaSlot titulo="Acá va el mapa">
          Se conecta con la librería de mapas que elija el equipo.
          {puntos.length > 0 && ` Recibe ${puntos.length} paradas`}
          {personas.length > 0 && ` y ${personas.length} personas con ubicación`}
          {(puntos.length > 0 || personas.length > 0) && '.'}
        </EsperaSlot>
        {personas.length > 0 && <AvatarStack people={personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))} max={6} />}
      </div>
      {puntos.length > 0 && onSeleccionarPunto && (
        <ul aria-label="Paradas" className="absolute inset-x-3 bottom-3 flex gap-2 overflow-x-auto">
          {puntos.map((punto) => (
            <li key={punto.id} className="flex-none">
              <button
                type="button"
                onClick={() => onSeleccionarPunto(punto.id)}
                className="min-h-toque rounded-full trazo-fino bg-papel-elevado px-3 text-meta font-extrabold shadow-chica"
              >
                {punto.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
