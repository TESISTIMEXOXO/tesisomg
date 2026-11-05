import { LogOut, Moon, Sun } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { CaminosDeFondo } from '../components/marca/CaminosDeFondo'
import { Logo } from '../components/marca/Logo'
import { Button } from '../components/ui/Button'
import { useCerrarSesion } from '../hooks/auth'
import { useTema } from '../hooks/tema'

/** La cuenta superadmin solo administra: sin viajes, sin "+", sin perfil. Además del panel, tiene el modo oscuro y salir. */
export function AdminLayout() {
  const cerrarSesion = useCerrarSesion()
  const { preferencia, elegir } = useTema()
  const oscuro = preferencia === 'oscuro'
  return (
    <div className="relative isolate min-h-dvh">
      <CaminosDeFondo />
      {/* La misma barra que BarraSuperior: el logo y el panel quedan alineados al mismo borde. */}
      <header className="mx-auto flex max-w-contenido items-center justify-between gap-3 px-4 pt-4 md:px-6 lg:px-10">
        <Link to="/admin" className="rounded-sm">
          <Logo size={30} className="lg:hidden" />
          <Logo size={40} className="max-lg:hidden" />
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="secundario"
            size="icono"
            icon={oscuro ? Sun : Moon}
            aria-label="Modo oscuro"
            aria-pressed={oscuro}
            onClick={() => elegir(oscuro ? 'claro' : 'oscuro')}
          />
          <Button variant="secundario" size="sm" icon={LogOut} disabled={cerrarSesion.isPending} onClick={() => cerrarSesion.mutate()}>
            {cerrarSesion.isPending ? 'Cerrando…' : 'Cerrar sesión'}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-contenido px-4 pt-6 pb-12 md:px-6 lg:px-10 lg:pt-8">
        {cerrarSesion.isError && (
          <p role="alert" className="mb-4 font-semibold text-negativo">No pudimos cerrar la sesión. Probá de nuevo.</p>
        )}
        <Outlet />
      </main>
    </div>
  )
}
