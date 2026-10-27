import { Mail } from 'lucide-react'
import type { Proveedor } from '../../types/auth'
import { Button } from '../ui/Button'

export type AuthSlotProps = {
  onElegirProveedor: (proveedor: Proveedor) => void
  /** cargando mientras el backend resuelve el ingreso; error si se canceló o falló. */
  estado?: 'listo' | 'cargando' | 'error'
}

const PROVEEDORES: { id: Proveedor; texto: string }[] = [
  { id: 'google', texto: 'Seguir con Google' },
  { id: 'apple', texto: 'Seguir con Apple' },
  { id: 'mail', texto: 'Seguir con mail' },
]

/** Slot de ingreso. Los botones y los estados son del front; el OAuth y el mail los resuelve el backend. */
export function AuthSlot({ onElegirProveedor, estado = 'listo' }: AuthSlotProps) {
  return (
    <div className="flex flex-col gap-3" aria-busy={estado === 'cargando'}>
      {PROVEEDORES.map((proveedor) => (
        <Button
          key={proveedor.id}
          variant={proveedor.id === 'google' ? 'primario' : 'secundario'}
          icon={proveedor.id === 'mail' ? Mail : undefined}
          full
          disabled={estado === 'cargando'}
          onClick={() => onElegirProveedor(proveedor.id)}
        >
          {proveedor.texto}
        </Button>
      ))}
      {estado === 'cargando' && (
        <p role="status" className="text-center text-meta text-tinta-suave">
          Estamos abriendo el ingreso…
        </p>
      )}
      {estado === 'error' && (
        <p role="alert" className="rounded-md border-2 border-negativo bg-coral-tinte px-4 py-3 font-semibold text-negativo">
          No pudimos completar el ingreso. Probá de nuevo.
        </p>
      )}
    </div>
  )
}
