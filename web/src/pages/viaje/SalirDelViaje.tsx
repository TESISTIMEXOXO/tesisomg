import { LogOut } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Ventana } from '../../components/ui/Ventana'
import { useSalirDelGrupo } from '../../hooks/grupo'
import { mensajeAlSalir } from '../../lib/erroresCuentas'
import type { Viaje } from '../../types/viaje'

/**
 * El botón del encabezado para dejar el viaje. Antes de salir, pide confirmarlo en una ventana. Si quien
 * sale es el único organizador y queda gente, en la misma ventana elige a quién le deja la organización.
 */
export function SalirDelViaje({ viaje }: { viaje: Viaje }) {
  const navigate = useNavigate()
  const salir = useSalirDelGrupo(viaje.id)
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idSucesor = useId()
  const [sucesor, setSucesor] = useState<string | null>(null)

  const yo = viaje.personas.find((persona) => persona.esVos)
  const otros = viaje.personas.filter((persona) => !persona.esVos)
  const tieneQueElegir = yo?.rol === 'organizador' && otros.length > 0 && !otros.some((persona) => persona.rol === 'organizador')

  function cerrar() {
    salir.reset()
    setSucesor(null)
  }

  return (
    <>
      <Button variant="emergencia" size="sm" icon={LogOut} className="max-md:size-11 max-md:gap-0 max-md:px-0" aria-haspopup="dialog" onClick={() => ventana.current?.showModal()}>
        <span className="max-md:sr-only">Salir del viaje</span>
      </Button>
      <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={cerrar}>
        <div className="flex flex-col gap-4">
          <h2 id={idTitulo} className="pr-12 font-display text-titulo-1 font-black">
            ¿Salís de “{viaje.nombre}”?
          </h2>
          <p>Si tenés plata o reservas pendientes, te las mostramos antes.</p>
          {tieneQueElegir && (
            <fieldset className="flex flex-col gap-3" aria-describedby={idSucesor}>
              <legend className="font-extrabold">¿Quién organiza el viaje cuando te vayas?</legend>
              <p id={idSucesor} className="-mt-1 text-meta text-tinta-suave">
                Sos quien organiza: antes de irte, elegí a alguien del grupo. Va a poder editar todo y sacar gente.
              </p>
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
                {otros.map((persona) => (
                  <label
                    key={persona.id}
                    className="flex min-h-toque cursor-pointer items-center gap-3 rounded-md trazo-fino bg-papel-hundido px-3 py-2 has-checked:ring-3 has-checked:ring-tinta"
                  >
                    <input
                      type="radio"
                      name={idSucesor}
                      value={persona.id}
                      checked={sucesor === persona.id}
                      onChange={() => setSucesor(persona.id)}
                      className="size-5 accent-tinta"
                    />
                    <AvatarStack people={[{ name: persona.nombre, pinz: persona.pinz }]} max={1} />
                    <span className="font-bold">{persona.nombre}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {salir.isError && (
            <p role="alert" className="font-semibold text-negativo">
              {mensajeAlSalir(salir.error)}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="emergencia"
              disabled={salir.isPending || (tieneQueElegir && !sucesor)}
              onClick={() => salir.mutate(tieneQueElegir ? (sucesor ?? undefined) : undefined, { onSuccess: () => navigate('/viajes') })}
            >
              {tieneQueElegir ? 'Dejarle la organización y salir' : 'Sí, salir del viaje'}
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
