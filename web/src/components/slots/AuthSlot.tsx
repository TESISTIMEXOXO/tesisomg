import { UserPlus } from 'lucide-react'
import type { Proveedor } from '../../types/auth'
import { Button } from '../ui/Button'

export type AuthSlotProps = {
  onElegirProveedor: (proveedor: Proveedor) => void
  /** cargando mientras el backend resuelve el ingreso; error si se canceló o falló. */
  estado?: 'listo' | 'cargando' | 'error'
  /** Reemplaza el mensaje de error genérico. */
  mensajeError?: string
}

const PROVEEDORES: { id: Proveedor; texto: string }[] = [
  { id: 'google', texto: 'Seguir con Google' },
  { id: 'mail', texto: 'Crear cuenta' },
]

/** Slot de ingreso. Los botones y los estados son del front; el OAuth y el mail los resuelve el backend. */
export function AuthSlot({ onElegirProveedor, estado = 'listo', mensajeError }: AuthSlotProps) {
  return (
    <div className="flex flex-col gap-3" aria-busy={estado === 'cargando'}>
      {PROVEEDORES.map((proveedor) => (
        <Button
          key={proveedor.id}
          variant={proveedor.id === 'google' ? 'primario' : 'secundario'}
          icon={proveedor.id === 'mail' ? UserPlus : undefined}
          full
          disabled={estado === 'cargando'}
          onClick={() => onElegirProveedor(proveedor.id)}
        >
          {proveedor.texto}
        </Button>
      ))}
      {estado === 'cargando' && (
        <p role="status" className="text-center text-meta text-tinta-suave">
          Elegí tu cuenta en la ventana de Google…
        </p>
      )}
      {estado === 'error' && (
        <p role="alert" className="rounded-md border-2 border-negativo bg-coral-tinte px-4 py-3 font-semibold text-negativo">
          {mensajeError ?? 'No pudimos completar el ingreso. Probá de nuevo.'}
        </p>
      )}
    </div>
  )
}
