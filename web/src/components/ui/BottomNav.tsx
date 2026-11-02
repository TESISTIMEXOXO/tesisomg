import { Siren, type LucideIcon } from 'lucide-react'
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
  /** Dentro de un viaje: a dónde lleva SOS, que está siempre, al final y en rojo. */
  sosTo?: string
}

const BASE = 'flex h-13 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full trazo-fino text-sobretitulo tracking-normal'
const INACTIVO = 'border-transparent text-tinta-suave hover:text-tinta'

/** La navegación de la app: una barra flotante abajo, en todos los tamaños. */
export function BottomNav({ items, sosTo }: BottomNavProps) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-20 flex justify-center">
      <nav aria-label="Principal" className="flex h-nav w-full max-w-105 items-center justify-around gap-1 rounded-full trazo bg-papel-elevado px-2 shadow-grande">
        {items.map(({ id, label, icon: Icono, to, end }) => (
          <NavLink key={id} to={to} end={end} className={({ isActive }) => `${BASE} ${isActive ? 'tema-claro bg-coral text-tinta' : INACTIVO}`}>
            <Icono size={22} strokeWidth={2} aria-hidden />
            {label}
          </NavLink>
        ))}
        {sosTo && (
          /* Activo no lleva el fondo coral de los demás: el rojo no se leería encima. */
          <NavLink
            to={sosTo}
            aria-label="SOS, emergencias"
            className={({ isActive }) => `${BASE} ${isActive ? 'border-emergencia bg-papel-hundido text-tinta' : INACTIVO}`}
          >
            <Siren size={22} strokeWidth={2} aria-hidden className="text-emergencia" />
            SOS
          </NavLink>
        )}
      </nav>
    </div>
  )
}
