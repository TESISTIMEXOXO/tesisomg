import { useState } from 'react'
import { ETAPAS } from '../../lib/etapa'
import { FONDO } from '../../pinz/tonos'
import type { Etapa } from '../../types/viaje'

type StageSwitchProps = {
  value?: Etapa
  defaultValue?: Etapa
  onChange?: (etapa: Etapa) => void
  className?: string
}

const ORDEN: Etapa[] = ['previaje', 'viaje', 'post']

/** Deja mirar cualquier etapa sin cambiar el estado del viaje. Las tres aparecen siempre. Hoy se usa solo en desarrollo. */
export function StageSwitch({ value, defaultValue = 'previaje', onChange, className = '' }: StageSwitchProps) {
  const [propia, setPropia] = useState(defaultValue)
  const actual = value ?? propia

  function elegir(etapa: Etapa) {
    if (value === undefined) setPropia(etapa)
    onChange?.(etapa)
  }

  return (
    <div
      role="group"
      aria-label="Etapa del viaje"
      className={`flex w-max max-w-full gap-1 rounded-full trazo bg-papel-elevado p-1 shadow-dura ${className}`}
    >
      {ORDEN.map((etapa) => {
        const activa = etapa === actual
        return (
          <button
            key={etapa}
            type="button"
            aria-pressed={activa}
            onClick={() => elegir(etapa)}
            className={`inline-flex min-h-toque items-center gap-2 rounded-full trazo-fino px-3 text-etiqueta transition-colors duration-200 ease-rebote motion-reduce:transition-none md:px-4 ${
              activa ? `tema-claro ${FONDO[ETAPAS[etapa].tono]} text-tinta` : 'border-transparent text-tinta-suave hover:text-tinta'
            }`}
          >
            <span aria-hidden className={`size-2.5 rounded-full border-2 ${activa ? 'border-tinta bg-tinta' : 'border-current'}`} />
            {ETAPAS[etapa].nombre}
          </button>
        )
      })}
    </div>
  )
}
