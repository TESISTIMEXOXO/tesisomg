import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type BuscadorProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Sin label visible: dice qué se busca a quien usa lector de pantalla. */
  'aria-label': string
}

/** Una barra de búsqueda chica, con la lupa adentro, para filtrar una lista sin ocupar una fila entera. */
export function Buscador({ className = '', ...resto }: BuscadorProps) {
  return (
    <label className={`relative flex min-w-0 items-center ${className}`}>
      <Search size={18} strokeWidth={2} aria-hidden className="pointer-events-none absolute left-3.5 text-tinta-suave" />
      <input
        type="search"
        className="min-h-toque w-full rounded-full trazo bg-papel-elevado pr-4 pl-10 font-semibold text-tinta shadow-chica placeholder:font-medium placeholder:text-tinta-suave focus-visible:shadow-dura"
        {...resto}
      />
    </label>
  )
}
