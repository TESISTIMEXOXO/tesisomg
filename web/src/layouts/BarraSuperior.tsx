import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/marca/Logo'
import { AvatarStack } from '../components/ui/AvatarStack'
import { usePerfil } from '../hooks/perfil'
import { MenuAgregar } from './MenuAgregar'

/** Arriba de la app: la marca lleva a Mis viajes, tu pinz a tu perfil y el + arma un viaje o te suma a uno. */
export function BarraSuperior({ antesDelPerfil }: { antesDelPerfil?: ReactNode }) {
  const { data: perfil } = usePerfil()
  return (
    <header className="mx-auto flex max-w-contenido items-center justify-between gap-3 px-4 pt-4 md:px-6 lg:px-10">
      <Link to="/viajes" className="rounded-sm">
        <Logo size={30} className="lg:hidden" />
        <Logo size={40} className="max-lg:hidden" />
      </Link>
      <div className="flex items-center gap-2">
        {antesDelPerfil}
        {perfil && (
          <Link to="/vos" aria-label="Tu perfil" className="grid size-11 place-items-center rounded-full">
            <AvatarStack people={[{ name: perfil.nombre, pinz: perfil.pinz }]} max={1} />
          </Link>
        )}
        <MenuAgregar />
      </div>
    </header>
  )
}
