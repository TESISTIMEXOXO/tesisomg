import { Plus, Ticket } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { CaminosDeLaVentana } from '../components/marca/CaminosDeLaVentana'
import { Ventana } from '../components/ui/Ventana'
import { FormularioCodigo } from '../pages/unirse/FormularioCodigo'
import { FormularioViaje } from '../pages/viajes/FormularioViaje'

const OPCION = 'flex min-h-toque w-full items-center gap-3 rounded-md px-3 text-left font-bold hover:bg-papel-hundido'
const TITULO = 'font-display text-titulo-1 font-black'

type Formulario = 'viaje' | 'codigo'

/** El + de la barra de arriba: despliega armar un viaje y unirse con código, y cada uno se abre en una ventana. */
export function MenuAgregar() {
  const [abierto, setAbierto] = useState(false)
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const ventana = useRef<HTMLDialogElement>(null)
  const idMenu = useId()
  const idTitulo = useId()

  /* Un click o toque afuera cierra el menú. */
  useEffect(() => {
    if (!abierto) return
    function alTocarAfuera(evento: PointerEvent) {
      if (evento.target instanceof Node && !contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alTocarAfuera)
    return () => document.removeEventListener('pointerdown', alTocarAfuera)
  }, [abierto])

  /* Se abre después de pintar el formulario: showModal enfoca su primer campo. */
  useEffect(() => {
    if (formulario && !ventana.current?.open) ventana.current?.showModal()
  }, [formulario])

  function abrir(elegido: Formulario) {
    setAbierto(false)
    setFormulario(elegido)
  }

  const cerrarVentana = () => ventana.current?.close()

  return (
    <>
      <div
        ref={contenedor}
        className="relative"
        onKeyDown={(evento) => {
          if (evento.key === 'Escape' && abierto) {
            setAbierto(false)
            boton.current?.focus()
          }
        }}
      >
        <button
          ref={boton}
          type="button"
          aria-expanded={abierto}
          aria-controls={idMenu}
          aria-label={abierto ? 'Cerrar el menú' : 'Armar un viaje o unirme a uno'}
          onClick={() => setAbierto((actual) => !actual)}
          className="tema-claro grid size-11 place-items-center rounded-full trazo bg-coral text-tinta shadow-chica transition-[translate,box-shadow] duration-120 ease-rebote hover:-translate-px hover:shadow-dura motion-reduce:transition-none"
        >
          <Plus
            size={22}
            strokeWidth={2.5}
            aria-hidden
            className={`transition-transform duration-200 motion-reduce:transition-none ${abierto ? 'rotate-45' : ''}`}
          />
        </button>
        {/* Queda montado para animar también al cerrarse; cerrado, no se ve ni recibe foco. */}
        <ul
          id={idMenu}
          inert={!abierto}
          className={`absolute top-full right-0 z-30 mt-2 flex w-60 origin-top-right flex-col gap-1 rounded-lg trazo bg-papel-elevado p-2 shadow-dura transition-[opacity,scale,translate,visibility] duration-200 ease-rebote motion-reduce:transition-none ${
            abierto ? 'visible opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
          }`}
        >
          <li>
            <button type="button" aria-haspopup="dialog" onClick={() => abrir('viaje')} className={OPCION}>
              <Plus size={20} strokeWidth={2} aria-hidden />
              Armar un viaje
            </button>
          </li>
          <li>
            <button type="button" aria-haspopup="dialog" onClick={() => abrir('codigo')} className={OPCION}>
              <Ticket size={20} strokeWidth={2} aria-hidden />
              Unirme con código
            </button>
          </li>
        </ul>
      </div>

      {/* Cerrar la ventana dispara su onClose, que desmonta el formulario: la próxima vez arranca vacío. */}
      <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={() => setFormulario(null)}>
        <CaminosDeLaVentana />
        {/* Como en el ingreso: sin el contorno del foco, el campo activo ya se marca con su sombra más grande. */}
        <div className="relative [&_input]:outline-none">
          {formulario === 'viaje' && (
            <FormularioViaje
              idTitulo={idTitulo}
              onListo={cerrarVentana}
              encabezado={
                <h2 id={idTitulo} className={`pr-24 ${TITULO}`}>
                  Armar un viaje
                </h2>
              }
            />
          )}
          {formulario === 'codigo' && (
            <FormularioCodigo
              idTitulo={idTitulo}
              onListo={cerrarVentana}
              className="gap-6"
              encabezado={
                <div className="flex flex-col gap-2 pr-24">
                  <h2 id={idTitulo} className={TITULO}>
                    Unirme a un viaje
                  </h2>
                  <p className="text-tinta-suave">Poné el código que te pasaron. Antes de sumarte, ves a qué viaje entrás.</p>
                </div>
              }
            />
          )}
        </div>
      </Ventana>
    </>
  )
}
