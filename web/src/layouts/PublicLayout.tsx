import { Outlet } from 'react-router-dom'
import { BarraMarca } from '../components/marca/BarraMarca'
import { CaminosDeFondo } from '../components/marca/CaminosDeFondo'

/** Las pantallas públicas fuera de la landing: bienvenida e invitaciones. */
export function PublicLayout() {
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
