import { Banda, TituloBanda } from './Banda'

const ETIQUETAS = [
  { texto: 'Con amigos', fondo: 'bg-sol' },
  { texto: 'En familia', fondo: 'bg-papel-elevado' },
  { texto: 'Egresados', fondo: 'bg-mar' },
  { texto: 'Mochileros', fondo: 'bg-papel-elevado' },
  { texto: 'Finde largo', fondo: 'bg-lavanda' },
  { texto: 'Despedidas', fondo: 'bg-papel-elevado' },
  { texto: 'Escapadas', fondo: 'bg-coral' },
  { texto: 'Viajes largos', fondo: 'bg-cielo' },
]

export function ParaQuienes() {
  return (
    <Banda className="flex flex-col gap-8">
      <TituloBanda>Para cualquier viaje en grupo.</TituloBanda>
      <ul className="flex flex-wrap gap-3.5">
        {ETIQUETAS.map((etiqueta) => (
          <li key={etiqueta.texto} className={`rounded-full trazo px-6 py-3 font-display text-titulo-2 font-black shadow-dura ${etiqueta.fondo}`}>
            {etiqueta.texto}
          </li>
        ))}
      </ul>
    </Banda>
  )
}
