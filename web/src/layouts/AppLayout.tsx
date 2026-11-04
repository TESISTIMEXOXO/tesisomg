import { MapPin, User } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { CaminosDeFondo } from '../components/marca/CaminosDeFondo'
import { BottomNav, type ItemNav } from '../components/ui/BottomNav'
import { BarraSuperior } from './BarraSuperior'

const SECCIONES: ItemNav[] = [
  { id: 'viajes', label: 'Mis viajes', icon: MapPin, to: '/viajes' },
  { id: 'vos', label: 'Vos', icon: User, to: '/vos' },
]

/** Fuera de un viaje: Mis viajes y Vos. */
export function AppLayout() {
  return (
    <div className="relative isolate min-h-dvh">
      <CaminosDeFondo />
      <BarraSuperior />
      <main className="mx-auto max-w-contenido px-4 pt-6 pb-29 md:px-6 lg:px-10 lg:pt-8">
        <Outlet />
      </main>
      <BottomNav items={SECCIONES} />
    </div>
  )
}
