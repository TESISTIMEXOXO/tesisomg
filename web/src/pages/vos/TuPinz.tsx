import { Pencil } from 'lucide-react'
import { useId, useRef, useState, type RefObject } from 'react'
import { ElegirPinz } from '../../components/marca/ElegirPinz'
import { Pin } from '../../components/marca/Pin'
import { Button } from '../../components/ui/Button'
import { Ventana } from '../../components/ui/Ventana'
import { useGuardarPerfil } from '../../hooks/perfil'
import { ELENCO, type PinzId } from '../../pinz/elenco'
import { FONDO_TINTE } from '../../pinz/tonos'
import type { Perfil } from '../../types/perfil'
import { datosDelPerfil } from './datosDelPerfil'

/**
 * La cabecera de Vos: tu nombre, tu pinz y qué hace por vos. Se cambia en una ventana, sin salir del perfil.
 * En mobile el pinz va al lado del nombre y la descripción abajo; desde md, todo en una fila con el botón al final.
 */
export function TuPinz({ perfil, className = '' }: { perfil: Perfil; className?: string }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const personaje = perfil.pinz ? ELENCO[perfil.pinz] : null

  return (
    <section
      aria-labelledby="tu-pinz-nombre"
      className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-lg trazo p-4 shadow-grande md:grid-cols-[auto_1fr_auto] md:gap-x-6 md:p-6 ${
        personaje ? FONDO_TINTE[personaje.tono] : 'bg-papel-elevado'
      } ${className}`}
    >
      <Pin pinz={perfil.pinz ?? 'generico'} size={112} label="" className="md:row-span-2" />
      <div className="flex min-w-0 flex-col md:self-end">
        <h2 id="tu-pinz-nombre" className="font-display text-titulo-1 font-black">
          {perfil.nombre}
        </h2>
        <p className="font-bold">{personaje ? `${personaje.nombre}, ${personaje.apodo}` : 'Todavía no elegiste tu pinz'}</p>
      </div>
      <div className="col-span-2 flex flex-col gap-1 md:col-span-1 md:col-start-2 md:self-start">
        <p>
          {personaje?.descripcion ?? 'Elegí una de las diez personalidades: así te ve el grupo en las votaciones, los gastos y el mapa.'}
        </p>
        {personaje && <p className="text-meta font-bold text-tinta-suave">Te acompaña en {personaje.acompana}</p>}
      </div>
      <Button
        variant="secundario"
        size="sm"
        icon={Pencil}
        className="col-span-2 justify-self-start md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1"
        onClick={() => ventana.current?.showModal()}
      >
        {personaje ? 'Cambiar tu pinz' : 'Elegir tu pinz'}
      </Button>
      {/* Con la key, al guardar arranca de nuevo con el pinz nuevo marcado. */}
      <CambiarPinz key={perfil.pinz} ventana={ventana} perfil={perfil} />
    </section>
  )
}

function CambiarPinz({ ventana, perfil }: { ventana: RefObject<HTMLDialogElement | null>; perfil: Perfil }) {
  const idTitulo = useId()
  const guardar = useGuardarPerfil()
  const [elegido, setElegido] = useState<PinzId | null>(perfil.pinz)
  const cambio = elegido !== null && elegido !== perfil.pinz

  /* Si cierra sin guardar, la próxima vez abre con el pinz que tiene. */
  function alCerrar() {
    setElegido(perfil.pinz)
    guardar.reset()
  }

  function confirmar() {
    if (!elegido) return
    guardar.mutate({ ...datosDelPerfil(perfil), pinz: elegido }, { onSuccess: () => ventana.current?.close() })
  }

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={alCerrar} ancho="amplia">
      <div className="flex flex-col gap-5">
        <h2 id={idTitulo} className="pr-12 font-display text-titulo-1 font-black">
          Cambiá tu pinz
        </h2>
        <ElegirPinz valor={elegido} onElegir={setElegido} leyenda="El que más se parece a cómo viajás. Así te ve el grupo." />
        {guardar.isError && (
          <p role="alert" className="font-semibold text-negativo">
            No pudimos cambiar tu pinz. Probá de nuevo.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button disabled={!cambio || guardar.isPending} onClick={confirmar}>
            {guardar.isPending ? 'Guardando…' : cambio ? `Quedarme con ${ELENCO[elegido].nombre}` : 'Elegí otro pinz'}
          </Button>
          <Button variant="fantasma" onClick={() => ventana.current?.close()}>
            Cancelar
          </Button>
        </div>
      </div>
    </Ventana>
  )
}
