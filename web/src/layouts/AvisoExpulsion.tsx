import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin } from '../components/marca/Pin'
import { Button } from '../components/ui/Button'
import { Ventana } from '../components/ui/Ventana'
import type { Expulsion } from '../lib/expulsion'

/** Se abre sola cuando a la persona la sacan del viaje que está mirando. Al cerrarla, vuelve a Mis viajes. */
export function AvisoExpulsion({ expulsion }: { expulsion: Expulsion }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (!ventana.current?.open) ventana.current?.showModal()
  }, [])

  function irAMisViajes() {
    // Mis viajes ya no tiene que mostrarlo.
    void queryClient.invalidateQueries({ queryKey: ['viajes'] })
    navigate('/viajes', { replace: true })
  }

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={irAMisViajes}>
      <div className="flex flex-col items-start gap-4 pr-10">
        <Pin pinz="brujula" size={64} label="" />
        <h2 id={idTitulo} className="font-display text-titulo-1 font-black text-balance">
          Te sacaron del viaje
        </h2>
        <p>
          {expulsion.por} te sacó de <strong className="font-extrabold">“{expulsion.viaje}”</strong>.{' '}
          {expulsion.baneado
            ? 'Como ya te sacaron tres veces, no vas a poder volver a sumarte a este viaje.'
            : 'Ya no vas a poder verlo. Si fue un error, pedile que te invite de nuevo.'}
        </p>
        <Button onClick={() => ventana.current?.close()}>Ir a mis viajes</Button>
      </div>
    </Ventana>
  )
}
