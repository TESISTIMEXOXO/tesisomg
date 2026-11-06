import { Check, MapPin, Navigation } from 'lucide-react'
import { estilosBoton } from './estilosBoton'

type ItineraryItemProps = {
  time: string
  title: string
  place?: string | null
  done?: boolean
  /** Lo que pasa ahora. Uno solo a la vez y solo en la etapa Viaje. */
  current?: boolean
  /** El último del día: corta la línea. */
  last?: boolean
  /** Dónde queda. Si se sabe, la tarjeta suma a la derecha un "Cómo llegar" que abre Google Maps. */
  ubicacion?: { lat: number; lng: number } | null
}

function rutaEnGoogleMaps({ lat, lng }: { lat: number; lng: number }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/** Un momento del día, unido a los demás por la línea de recorrido punteada de la marca. */
export function ItineraryItem({ time, title, place, done = false, current = false, last = false, ubicacion }: ItineraryItemProps) {
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
      <div className={`@container mb-3 flex min-w-0 flex-1 items-center gap-3 rounded-md trazo px-4 py-3 ${tarjeta}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
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
        {ubicacion && (
          <a
            href={rutaEnGoogleMaps(ubicacion)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Cómo llegar a ${place ?? title} (abre Google Maps)`}
            className={`${estilosBoton('secundario', 'sm')} flex-none whitespace-nowrap @max-sm:size-toque @max-sm:px-0`}
          >
            <Navigation size={20} strokeWidth={2} aria-hidden />
            {/* En una tarjeta angosta queda solo el ícono: el texto apretaba el título hasta partirlo palabra por palabra. */}
            <span className="@max-sm:sr-only">Cómo llegar</span>
          </a>
        )}
      </div>
    </li>
  )
}
