import { Outlet } from 'react-router-dom'
import { BarraMarca } from '../components/marca/BarraMarca'

/** Las pantallas públicas fuera de la landing: bienvenida e invitaciones. */
export function PublicLayout() {
  return (
    <div className="min-h-dvh">
      <BarraMarca />
      <main className="mx-auto w-full max-w-140 px-4 pb-12 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
