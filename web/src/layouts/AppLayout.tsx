import { MapPin, User } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { BarraLateral } from '../components/ui/BarraLateral'
import { BottomNav, type ItemNav } from '../components/ui/BottomNav'
import { BarraSuperior } from './BarraSuperior'
import { CuentaUsuario } from './CuentaUsuario'

const SECCIONES: ItemNav[] = [
  { id: 'viajes', label: 'Mis viajes', icon: MapPin, to: '/viajes' },
  { id: 'vos', label: 'Vos', icon: User, to: '/vos' },
]

/** Fuera de un viaje: Mis viajes y Vos. */
export function AppLayout() {
  return (
    <div className="lg:flex">
      <BarraLateral items={SECCIONES} cuenta={<CuentaUsuario />} />
      <div className="min-w-0 flex-1">
        <BarraSuperior />
        <main className="mx-auto max-w-contenido px-4 pt-6 pb-29 md:px-6 lg:px-10 lg:pt-8 lg:pb-12">
          <Outlet />
        </main>
        <div className="fixed inset-x-4 bottom-4 z-20 flex justify-center lg:hidden">
          <BottomNav items={SECCIONES} />
        </div>
      </div>
    </div>
  )
}
