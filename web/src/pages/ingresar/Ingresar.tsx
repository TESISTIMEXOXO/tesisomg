import { Link, useNavigate } from 'react-router-dom'
import { AuthSlot } from '../../components/slots/AuthSlot'
import { useIngresar } from '../../hooks/auth'

export function Ingresar() {
  const ingresar = useIngresar()
  const navigate = useNavigate()
  const estado = ingresar.isPending ? 'cargando' : ingresar.isError ? 'error' : 'listo'

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-black">Entrá a Pinz</h1>
        <p className="text-cuerpo-lg text-tinta-suave">Sin otra contraseña para recordar: entrá con tu cuenta de siempre.</p>
      </div>
      <AuthSlot estado={estado} onElegirProveedor={(proveedor) =>
          // Bypass temporal: en desarrollo cualquier proveedor entra directo a la app. Se borra cuando el backend maneje la sesión.
          ingresar.mutate(proveedor, { onSuccess: () => import.meta.env.DEV && navigate('/viajes') })
        }
      />
      <p className="text-center">
        ¿Te pasaron un código?{' '}
        <Link to="/unirse" className="rounded-sm font-extrabold underline decoration-2 underline-offset-4">
          Unite a un viaje
        </Link>
      </p>
    </div>
  )
}
