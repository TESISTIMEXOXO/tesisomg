import { Check, MapPin } from 'lucide-react'

type ItineraryItemProps = {
  time: string
  title: string
  place?: string | null
  done?: boolean
  /** Lo que pasa ahora. Uno solo a la vez y solo en la etapa Viaje. */
  current?: boolean
  /** El último del día: corta la línea. */
  last?: boolean
}

/** Un momento del día, unido a los demás por la línea de recorrido punteada de la marca. */
export function ItineraryItem({ time, title, place, done = false, current = false, last = false }: ItineraryItemProps) {
  const punto = done ? 'bg-tinta text-papel' : current ? 'bg-mar ring-4 ring-mar-tinte' : 'bg-papel-elevado'
  const tarjeta = done ? 'bg-papel-hundido' : current ? 'bg-mar-tinte shadow-dura' : 'bg-papel-elevado shadow-chica'
  return (
    <li className="flex gap-3">
      <div aria-hidden className="relative flex w-7.5 flex-none justify-center">
        <span className={`relative z-10 mt-1.5 grid size-6 place-items-center rounded-full trazo ${punto}`}>
          {done && <Check size={14} strokeWidth={2} />}
        </span>
        {!last && (
          <span className={`absolute top-7.5 -bottom-1 border-l-3 border-dashed ${done ? '' : 'opacity-35'}`} />
        )}
      </div>
      <div className={`mb-3 flex min-w-0 flex-1 flex-col gap-0.5 rounded-md trazo px-4 py-3 ${tarjeta}`}>
        <span className={`flex items-center gap-2 text-meta font-extrabold numeros ${current ? 'text-tinta' : 'text-tinta-suave'}`}>
          {time}
          {current && <span className="tema-claro rounded-full trazo-fino bg-mar px-2.5 py-0.5 text-sobretitulo text-tinta uppercase">Ahora</span>}
          {done && <span className="sr-only">, ya pasó</span>}
        </span>
        <span className={`font-extrabold ${done ? 'text-tinta-suave' : ''}`}>{title}</span>
        {place && (
          <span className="flex items-center gap-1 text-meta text-tinta-suave">
            <MapPin size={16} strokeWidth={2} aria-hidden />
            {place}
          </span>
        )}
      </div>
    </li>
  )
}
