import { Check, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { Etapa } from '../../types/viaje'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /** Color al estar seleccionado: el de la etapa de la pantalla, o neutro fuera de un viaje. */
  tone?: 'neutro' | Etapa
  icon?: LucideIcon
  children: ReactNode
}

const SELECCIONADO: Record<NonNullable<ChipProps['tone']>, string> = {
  neutro: 'bg-tinta text-papel',
  previaje: 'tema-claro bg-sol text-tinta',
  viaje: 'tema-claro bg-mar text-tinta',
  post: 'tema-claro bg-lavanda text-tinta',
}

export function Chip({ selected = false, tone = 'neutro', icon: Icono, className = '', children, ...resto }: ChipProps) {
  const estado = selected ? `translate-0.5 shadow-none ${SELECCIONADO[tone]}` : 'bg-papel-elevado text-tinta shadow-chica'
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-toque flex-none items-center gap-1 rounded-full trazo-fino px-4 text-etiqueta transition-[translate,box-shadow] duration-120 ease-rebote motion-reduce:transition-none ${estado} ${className}`}
      {...resto}
    >
      {selected ? <Check size={16} strokeWidth={2} aria-hidden /> : Icono && <Icono size={16} strokeWidth={2} aria-hidden />}
      <span>{children}</span>
    </button>
  )
}
