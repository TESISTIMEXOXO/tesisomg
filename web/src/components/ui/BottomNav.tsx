import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export type ItemNav = {
  id: string
  label: string
  icon: LucideIcon
  to: string
  /** Activo solo con la ruta exacta (Resumen, que es la raíz del viaje). */
  end?: boolean
}

type BottomNavProps = {
  /** Como mucho 4. Dentro de un viaje: Resumen, Plan, Cuentas y Baúl, siempre en ese orden. */
  items: ItemNav[]
  className?: string
}

/** Pill flotante de mobile. Desde desktop la reemplaza la BarraLateral. */
export function BottomNav({ items, className = '' }: BottomNavProps) {
  return (
    <nav
      aria-label="Principal"
      className={`flex h-nav w-full max-w-105 items-center justify-around gap-1 rounded-full trazo bg-papel-elevado px-2 shadow-grande ${className}`}
    >
      {items.map(({ id, label, icon: Icono, to, end }) => (
        <NavLink
          key={id}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex h-13 flex-1 flex-col items-center justify-center gap-0.5 rounded-full trazo-fino text-sobretitulo tracking-normal ${
              isActive ? 'tema-claro bg-coral text-tinta' : 'border-transparent text-tinta-suave hover:text-tinta'
            }`
          }
        >
          <Icono size={22} strokeWidth={2} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
