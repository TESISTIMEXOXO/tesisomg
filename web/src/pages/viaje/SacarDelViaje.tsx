import { UserMinus } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { Ventana } from '../../components/ui/Ventana'
import { useEcharDelGrupo } from '../../hooks/grupo'
import { mensajeAlEchar } from '../../lib/erroresCuentas'
import { MAX_EXPULSIONES, type Persona } from '../../types/persona'

type SacarDelViajeProps = {
  viajeId: string
  nombreViaje: string
  /** A quién se quiere sacar. null: la ventana está cerrada. */
  persona: Persona | null
  onCerrar: () => void
}

/** La confirmación antes de sacar a alguien del grupo: solo la ve quien organiza. */
export function SacarDelViaje({ viajeId, nombreViaje, persona, onCerrar }: SacarDelViajeProps) {
  const echar = useEcharDelGrupo(viajeId)
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (persona && !ventana.current?.open) ventana.current?.showModal()
  }, [persona])

  function cerrar() {
    echar.reset()
    onCerrar()
  }

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={cerrar}>
      {persona && (
        <div className="flex flex-col gap-4">
          <h2 id={idTitulo} className="pr-12 font-display text-titulo-1 font-black text-balance">
            ¿Sacás a {persona.nombre} de “{nombreViaje}”?
          </h2>
          <AvisoStrikes nombre={persona.nombre} vez={(persona.vecesSacado ?? 0) + 1} />
          {echar.isError && (
            <p role="alert" className="font-semibold text-negativo">
              {mensajeAlEchar(echar.error, persona.nombre)}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="emergencia"
              icon={UserMinus}
              disabled={echar.isPending}
              onClick={() => echar.mutate(persona.id, { onSuccess: () => ventana.current?.close() })}
            >
              {echar.isPending ? 'Sacando…' : `Sí, sacar a ${persona.nombre}`}
            </Button>
            <Button variant="fantasma" onClick={() => ventana.current?.close()}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Ventana>
  )
}

/** Tres strikes: cuántas veces van, y si esta es la que no tiene vuelta atrás. */
function AvisoStrikes({ nombre, vez }: { nombre: string; vez: number }) {
  if (vez >= MAX_EXPULSIONES) {
    return (
      <p className="rounded-md trazo-fino bg-negativo/10 p-3 font-semibold">
        Es la {vez}.ª vez que sacan a {nombre} de este viaje: después de esto no va a poder volver a sumarse, ni con el link ni con
        una invitación nueva.
      </p>
    )
  }
  const quedan = MAX_EXPULSIONES - vez
  return (
    <p>
      Va a dejar de ver el viaje. Si fue un error, la podés invitar de nuevo.{' '}
      {vez === 1
        ? `Si la sacan ${MAX_EXPULSIONES} veces, ya no va a poder volver.`
        : `Ya la sacaron ${vez - 1} ${vez - 1 === 1 ? 'vez' : 'veces'}: después de esta, ${quedan === 1 ? 'una más' : `${quedan} más`} y ya no puede volver.`}
    </p>
  )
}
