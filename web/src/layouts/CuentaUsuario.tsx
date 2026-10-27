import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvatarStack } from '../components/ui/AvatarStack'
import { Button } from '../components/ui/Button'
import { useCerrarSesion } from '../hooks/auth'
import { usePerfil } from '../hooks/perfil'

/** Al pie de la barra lateral: tu perfil y cerrar sesión, a la vista desde cualquier pantalla. */
export function CuentaUsuario() {
  const { data: perfil } = usePerfil()
  const cerrarSesion = useCerrarSesion()
  return (
    <div className="flex flex-col gap-2 border-t-2 border-dashed pt-4">
      {perfil && (
        <Link to="/vos" className="flex min-h-toque items-center gap-3 rounded-md px-2 py-1.5 hover:bg-papel-elevado">
          <AvatarStack people={[{ name: perfil.nombre, pinz: perfil.pinz }]} max={1} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-extrabold">{perfil.nombre}</span>
            <span className="text-meta text-tinta-suave">Tu perfil</span>
          </span>
        </Link>
      )}
      <Button variant="secundario" size="sm" icon={LogOut} full disabled={cerrarSesion.isPending} onClick={() => cerrarSesion.mutate()}>
        {cerrarSesion.isPending ? 'Cerrando…' : 'Cerrar sesión'}
      </Button>
      {cerrarSesion.isError && (
        <p role="alert" className="text-meta font-semibold text-negativo">
          No pudimos cerrar la sesión. Probá de nuevo.
        </p>
      )}
    </div>
  )
}
