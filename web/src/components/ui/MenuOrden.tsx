import { ArrowDownUp, Check } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type OpcionOrden<T extends string> = { id: T; texto: string }

type MenuOrdenProps<T extends string> = {
  opciones: readonly OpcionOrden<T>[]
  valor: T
  onCambiar: (valor: T) => void
}

/** La flecha que despliega cómo ordenar una lista. Se abre y se cierra animada, como el + de la barra. */
export function MenuOrden<T extends string>({ opciones, valor, onCambiar }: MenuOrdenProps<T>) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idMenu = useId()
  const actual = opciones.find((opcion) => opcion.id === valor)

  useEffect(() => {
    if (!abierto) return
    function alTocarAfuera(evento: PointerEvent) {
      if (evento.target instanceof Node && !contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alTocarAfuera)
    return () => document.removeEventListener('pointerdown', alTocarAfuera)
  }, [abierto])

  return (
    <div
      ref={contenedor}
      className="relative flex-none"
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
        aria-label={`Ordenar: ${actual?.texto ?? ''}`}
        title={actual?.texto}
        onClick={() => setAbierto((antes) => !antes)}
        className="grid size-11 place-items-center rounded-full trazo bg-papel-elevado shadow-chica transition-[translate,box-shadow] duration-120 ease-rebote hover:-translate-px hover:shadow-dura motion-reduce:transition-none"
      >
        <ArrowDownUp size={20} strokeWidth={2} aria-hidden />
      </button>
      <ul
        id={idMenu}
        inert={!abierto}
        className={`absolute top-full right-0 z-30 mt-2 flex w-56 origin-top-right flex-col gap-1 rounded-lg trazo bg-papel-elevado p-2 shadow-dura transition-[opacity,scale,translate,visibility] duration-200 ease-rebote motion-reduce:transition-none ${
          abierto ? 'visible opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
        }`}
      >
        {opciones.map((opcion) => (
          <li key={opcion.id}>
            <button
              type="button"
              aria-pressed={opcion.id === valor}
              onClick={() => {
                onCambiar(opcion.id)
                setAbierto(false)
                boton.current?.focus()
              }}
              className="flex min-h-toque w-full items-center justify-between gap-3 rounded-md px-3 text-left font-bold hover:bg-papel-hundido"
            >
              {opcion.texto}
              {opcion.id === valor && <Check size={18} strokeWidth={2} aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
