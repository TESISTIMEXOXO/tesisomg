const TRAMOS = [
  { d: 'M30 -16C30 50 100 104 206 104', lugar: 'top-0 right-0 origin-top-right', ancho: 190, alto: 120 },
  { d: 'M-16 16C60 16 130 60 130 126', lugar: 'bottom-0 left-0 origin-bottom-left', ancho: 150, alto: 110 },
]

/**
 * Dos tramos del camino de la landing, en las esquinas de una Ventana. Quedan detrás del contenido,
 * que va en un bloque `relative` y con el título corrido a la izquierda (pr-24) para no pisar el de arriba.
 */
export function CaminosDeLaVentana() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      {TRAMOS.map(({ d, lugar, ancho, alto }) => (
        <svg key={lugar} width={ancho} height={alto} className={`absolute max-md:scale-60 ${lugar}`}>
          <path d={d} fill="none" strokeWidth={22} strokeLinecap="round" className="stroke-contorno" />
          <path d={d} fill="none" strokeWidth={16} strokeLinecap="round" className="stroke-cielo" />
        </svg>
      ))}
    </div>
  )
}
