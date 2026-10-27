import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '../marca/Logo'
import type { ItemNav } from './BottomNav'

type BarraLateralProps = {
  items: ItemNav[]
  /** Un link al pie, separado de las secciones ("Mis viajes" dentro de un viaje). */
  pie?: { label: string; icon: LucideIcon; to: string }
  /** Lo último de la barra: la cuenta de quien está usando la app. */
  cuenta?: ReactNode
}

/** La navegación de desktop: 240px a la izquierda sobre papel hundido. */
export function BarraLateral({ items, pie, cuenta }: BarraLateralProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-lateral flex-none flex-col gap-2 trazo-grueso-r bg-papel-hundido px-4.5 py-6 lg:flex">
      <Link to="/viajes" className="mb-4.5 self-start rounded-sm">
        <Logo size={34} />
      </Link>
      <nav aria-label="Principal" className="flex flex-col gap-2">
        {items.map(({ id, label, icon: Icono, to, end }) => (
          <NavLink
            key={id}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-toque items-center gap-2.5 rounded-md trazo px-3.5 py-3 text-cuerpo ${
                isActive ? 'tema-claro bg-coral font-extrabold shadow-chica' : 'border-transparent font-bold hover:bg-papel-elevado'
              }`
            }
          >
            <Icono size={22} strokeWidth={2} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        {pie && (
          <Link to={pie.to} className="flex min-h-toque items-center gap-2.5 rounded-md px-3.5 text-etiqueta font-bold hover:bg-papel-elevado">
            <pie.icon size={22} strokeWidth={2} aria-hidden />
            {pie.label}
          </Link>
        )}
        {cuenta}
      </div>
    </aside>
  )
}
