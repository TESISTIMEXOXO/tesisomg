import { Navigate, Outlet } from 'react-router-dom'
import { BarraMarca } from '../components/marca/BarraMarca'
import { CaminosDeFondo } from '../components/marca/CaminosDeFondo'
import { useSesion } from '../hooks/auth'
import { esSuperadmin } from '../lib/admin'

/** Las pantallas públicas fuera de la landing: bienvenida e invitaciones. */
export function PublicLayout() {
  const { data: sesion } = useSesion()
  // La superadmin no se suma a viajes: cualquier invitación la devuelve a su panel.
  if (esSuperadmin(sesion?.email)) return <Navigate to="/admin" replace />
  return (
    <div className="relative isolate min-h-dvh">
      <CaminosDeFondo />
      <BarraMarca />
      <main className="mx-auto w-full max-w-140 px-4 pb-12 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
