import { Pin } from '../../components/marca/Pin'
import type { TonoPinz } from '../../pinz/elenco'

const DESTINOS: { nombre: string; tono: TonoPinz }[] = [
  { nombre: 'Bariloche', tono: 'sol' },
  { nombre: 'Mar de las Pampas', tono: 'mar' },
  { nombre: 'Salta y Jujuy', tono: 'lavanda' },
  { nombre: 'Mendoza', tono: 'coral' },
  { nombre: 'Finde largo', tono: 'cielo' },
  { nombre: 'Egresados', tono: 'sol' },
]

/* La lista va dos veces seguidas: la cinta se corre media vuelta y empieza de nuevo sin salto. */
export function CintaDestinos() {
  return (
    <section aria-label="Destinos y planes" className="overflow-hidden trazo-grueso-t bg-tinta text-papel">
      <div className="flex w-max py-4.5 font-display text-titulo-1 font-black whitespace-nowrap motion-safe:animate-cinta hover:pausada lg:text-display">
        {[0, 1].map((vuelta) => (
          <ul key={vuelta} aria-hidden={vuelta === 1} className="flex items-center gap-8.5 pr-8.5">
            {DESTINOS.map((destino) => (
              <li key={destino.nombre} className="flex items-center gap-8.5">
                {destino.nombre}
                <Pin color={destino.tono} size={38} label="" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
