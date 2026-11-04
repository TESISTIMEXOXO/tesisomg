import { LogOut } from 'lucide-react'
import { useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Ventana } from '../../components/ui/Ventana'
import { useSalirDelGrupo } from '../../hooks/grupo'
import { mensajeAlSalir } from '../../lib/erroresCuentas'
import type { Viaje } from '../../types/viaje'

/** El botón del encabezado para dejar el viaje. Antes de salir, pide confirmarlo en una ventana. */
export function SalirDelViaje({ viaje }: { viaje: Viaje }) {
  const navigate = useNavigate()
  const salir = useSalirDelGrupo(viaje.id)
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  return (
    <>
      <Button variant="emergencia" size="sm" icon={LogOut} className="max-md:size-11 max-md:gap-0 max-md:px-0" aria-haspopup="dialog" onClick={() => ventana.current?.showModal()}>
        <span className="max-md:sr-only">Salir del viaje</span>
      </Button>
      <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={() => salir.reset()}>
        <div className="flex flex-col gap-4">
          <h2 id={idTitulo} className="pr-12 font-display text-titulo-1 font-black">
            ¿Salís de “{viaje.nombre}”?
          </h2>
          <p>Si tenés plata o reservas pendientes, te las mostramos antes.</p>
          {salir.isError && (
            <p role="alert" className="font-semibold text-negativo">
              {mensajeAlSalir(salir.error)}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="emergencia"
              disabled={salir.isPending}
              onClick={() => salir.mutate(undefined, { onSuccess: () => navigate('/viajes') })}
            >
              Sí, salir del viaje
            </Button>
            <Button variant="fantasma" onClick={() => ventana.current?.close()}>
              Me quedo
            </Button>
          </div>
        </div>
      </Ventana>
    </>
  )
}
