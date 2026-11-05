import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { estilosBoton } from '../ui/estilosBoton'

type MenuProps = {
  /** El texto del botón: la opción elegida o la acción. */
  etiqueta: string
  /** Para lectores de pantalla, cuando la etiqueta sola no alcanza ("Vista: Semana"). */
  etiquetaAccesible?: string
  icono?: LucideIcon
  /** Hacia dónde se abre: alineado al borde izquierdo o al derecho del botón. */
  lado?: 'izquierda' | 'derecha'
  /** Solo el ícono en celular, para que la barra entre en una línea. */
  compactoEnCelular?: boolean
  /** Las opciones (OpcionMenu). Elegir una cierra el menú. */
  children: ReactNode
  /** Una nota al pie del menú. */
  pie?: ReactNode
}

const ITEMS = '[role^="menuitem"]'

/**
 * Un botón que abre una lista de opciones flotando arriba de la página.
 * Con teclado: flechas para moverse, Escape para cerrar y volver al botón. Se cierra al tocar afuera.
 */
export function Menu({ etiqueta, etiquetaAccesible, icono: Icono, lado = 'izquierda', compactoEnCelular = false, children, pie }: MenuProps) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const id = useId()

  const cerrar = (devolverFoco = true) => {
    setAbierto(false)
    if (devolverFoco) boton.current?.focus()
  }

  useEffect(() => {
    if (!abierto) return
    /* Al abrir, el foco va a la opción elegida o a la primera. */
    const items = lista.current?.querySelectorAll<HTMLElement>(ITEMS)
    const elegido = lista.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    ;(elegido ?? items?.[0])?.focus()

    const tocarAfuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', tocarAfuera)
    return () => document.removeEventListener('pointerdown', tocarAfuera)
  }, [abierto])

  function teclas(evento: KeyboardEvent) {
    const items = Array.from(lista.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])
    const actual = items.indexOf(document.activeElement as HTMLElement)
    const ir = (indice: number) => items[(indice + items.length) % items.length]?.focus()
    if (evento.key === 'Escape') {
      evento.preventDefault()
      cerrar()
    } else if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      ir(actual + 1)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      ir(actual - 1)
    } else if (evento.key === 'Home') {
      evento.preventDefault()
      ir(0)
    } else if (evento.key === 'End') {
      evento.preventDefault()
      ir(items.length - 1)
    } else if (evento.key === 'Tab') {
      cerrar(false)
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={etiquetaAccesible}
        onClick={() => setAbierto((antes) => !antes)}
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowDown' && !abierto) {
            evento.preventDefault()
            setAbierto(true)
          }
        }}
        className={`${estilosBoton('secundario', 'sm')} ${compactoEnCelular ? 'max-md:size-toque max-md:px-0' : ''}`}
      >
        {Icono && <Icono size={20} strokeWidth={2} aria-hidden />}
        <span className={compactoEnCelular ? 'max-md:sr-only' : ''}>{etiqueta}</span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          aria-hidden
          className={`transition-transform duration-120 ${abierto ? 'rotate-180' : ''} ${compactoEnCelular ? 'max-md:hidden' : ''}`}
        />
      </button>
      <div
        ref={lista}
        id={id}
        role="menu"
        aria-label={etiquetaAccesible ?? etiqueta}
        inert={!abierto}
        data-abierto={abierto}
        onKeyDown={teclas}
        onClick={(evento) => {
          if ((evento.target as HTMLElement).closest(ITEMS)) cerrar()
        }}
        className={`absolute top-full z-30 mt-2.5 flex min-w-60 flex-col gap-0.5 rounded-md trazo bg-papel-elevado p-1.5 shadow-dura transition-[opacity,scale,translate] duration-120 ease-rebote motion-reduce:transition-none ${
          lado === 'derecha' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
        } ${abierto ? 'opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'}`}
      >
        {children}
        {pie && <div className="mx-1.5 mt-1 border-t-2 border-linea px-1.5 pt-2.5 pb-1.5 text-meta text-tinta-suave">{pie}</div>}
      </div>
    </div>
  )
}

type OpcionMenuProps = {
  icono?: LucideIcon
  /** Para las opciones de una sola elección (la vista): lleva el tilde. */
  elegida?: boolean
  /** Un atajo o detalle a la derecha, en gris. */
  detalle?: string
  onElegir: () => void
  children: ReactNode
}

export function OpcionMenu({ icono: Icono, elegida, detalle, onElegir, children }: OpcionMenuProps) {
  const esRadio = elegida !== undefined
  return (
    <button
      type="button"
      role={esRadio ? 'menuitemradio' : 'menuitem'}
      aria-checked={esRadio ? elegida : undefined}
      tabIndex={-1}
      onClick={onElegir}
      className={`flex min-h-toque w-full items-center gap-3 rounded-sm px-3 text-left text-etiqueta outline-offset-0 hover:bg-papel-hundido focus-visible:bg-papel-hundido focus-visible:outline-2 ${
        elegida ? 'bg-papel-hundido font-black' : ''
      }`}
    >
      {Icono && <Icono size={20} strokeWidth={2} aria-hidden className="flex-none" />}
      <span className="flex-1">{children}</span>
      {detalle && <span className="text-meta text-tinta-suave">{detalle}</span>}
      {esRadio && <Check size={18} strokeWidth={2.5} aria-hidden className={elegida ? '' : 'invisible'} />}
    </button>
  )
}
