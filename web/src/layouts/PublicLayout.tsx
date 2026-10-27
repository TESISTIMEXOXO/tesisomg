import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../components/marca/Logo'

/** Las pantallas públicas fuera de la landing: ingreso, bienvenida e invitaciones. */
export function PublicLayout() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-contenido items-center px-4 py-5 md:px-6">
        <Link to="/" className="rounded-sm">
          <Logo size={30} />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-140 px-4 pb-12 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
