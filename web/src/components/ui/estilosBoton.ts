export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'emergencia'
export type TamanoBoton = 'md' | 'sm'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full trazo font-texto text-etiqueta text-center text-balance ' +
  'transition-[translate,box-shadow,background-color] duration-120 ease-rebote ' +
  'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none'

const RELLENO: Record<VarianteBoton, string> = {
  primario: 'tema-claro bg-coral text-tinta',
  secundario: 'bg-papel-elevado text-tinta',
  fantasma: 'border-transparent bg-transparent text-tinta underline decoration-2 underline-offset-4 hover:bg-papel-hundido',
  emergencia: 'tema-claro bg-emergencia text-papel-elevado',
}

const TAMANO: Record<TamanoBoton, string> = {
  md: 'min-h-control px-5.5',
  sm: 'min-h-toque px-4',
}

/* Al pasar el mouse sube y la sombra crece; al presionar se hunde 3px, como un botón real. */
const SOMBRA: Record<TamanoBoton, string> = {
  md: 'shadow-dura hover:shadow-grande',
  sm: 'shadow-chica hover:shadow-dura',
}
const MOVIMIENTO =
  'hover:-translate-px active:translate-0.75 active:shadow-chica ' +
  'disabled:translate-0 disabled:shadow-none motion-reduce:hover:translate-0 motion-reduce:active:translate-0'

/** Las clases del botón, para usarlas también en links que se ven como botón. */
export function estilosBoton(variant: VarianteBoton = 'primario', size: TamanoBoton = 'md', full = false) {
  const relieve = variant === 'fantasma' ? '' : `${SOMBRA[size]} ${MOVIMIENTO}`
  return `${BASE} ${TAMANO[size]} ${RELLENO[variant]} ${relieve} ${full ? 'w-full' : ''}`
}
