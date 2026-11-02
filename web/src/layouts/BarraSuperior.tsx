import { Link } from 'react-router-dom'
import { Logo } from '../components/marca/Logo'
import { AvatarStack } from '../components/ui/AvatarStack'
import { usePerfil } from '../hooks/perfil'

/** Arriba de la app: la marca lleva a Mis viajes y tu pinz a tu perfil. */
export function BarraSuperior() {
  const { data: perfil } = usePerfil()
  return (
    <header className="mx-auto flex max-w-contenido items-center justify-between gap-3 px-4 pt-4 md:px-6 lg:px-10">
      <Link to="/viajes" className="rounded-sm">
        <Logo size={30} />
      </Link>
      {perfil && (
        <Link
          to="/vos"
          className="flex min-h-toque items-center gap-2 rounded-full trazo-fino bg-papel-elevado py-1 pr-4 pl-2 text-etiqueta shadow-chica"
        >
          <AvatarStack people={[{ name: perfil.nombre, pinz: perfil.pinz }]} max={1} />
          Tu perfil
        </Link>
      )}
    </header>
  )
}
