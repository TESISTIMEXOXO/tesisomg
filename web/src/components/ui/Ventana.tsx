import { X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

type AnchoVentana = 'normal' | 'amplia' | 'pantalla'

const CAJA: Record<AnchoVentana, string> = {
  normal: 'max-w-136',
  amplia: 'max-w-200',
  pantalla: 'flex h-full max-w-contenido flex-col',
}

type VentanaProps = {
  /** Se abre con ventanaRef.current.showModal() y se cierra con .close(), Esc, la X o un click afuera. */
  ventanaRef: RefObject<HTMLDialogElement | null>
  idTitulo: string
  onClose?: () => void
  /**
   * normal: formularios y avisos. amplia: grillas que necesitan aire, como elegir pinz.
   * pantalla: para mirar algo grande, como un archivo; ocupa toda la pantalla, con su margen, y el contenido se reparte el alto.
   */
  ancho?: AnchoVentana
  children: ReactNode
}

/** La ventana emergente: oscurece el fondo y deja el foco adentro. */
export function Ventana({ ventanaRef, idTitulo, onClose, ancho = 'normal', children }: VentanaProps) {
  return (
    <dialog
      ref={ventanaRef}
      aria-labelledby={idTitulo}
      onClose={onClose}
      /* Al apretar y no al soltar: si se selecciona texto y el mouse termina afuera, no se pierde lo escrito. */
      onMouseDown={(evento) => evento.target === ventanaRef.current && ventanaRef.current.close()}
      className={`m-auto w-full max-w-none bg-transparent p-4 backdrop:bg-tinta/50 motion-safe:backdrop:animate-fundido ${
        ancho === 'pantalla' ? 'h-dvh max-h-none' : ''
      }`}
    >
      {/* El dialog ocupa todo el ancho y el padding es el margen en mobile; un click ahí cierra. */}
      <div
        className={`relative mx-auto rounded-lg trazo-grueso bg-papel-elevado p-6 text-tinta shadow-grande motion-safe:animate-ventana md:p-8 ${CAJA[ancho]}`}
      >
        {children}
        {/* Después del contenido: showModal enfoca lo primero que encuentra, y tiene que ser el primer campo. */}
        <button
          type="button"
          onClick={() => ventanaRef.current?.close()}
          aria-label="Cerrar"
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full hover:bg-papel-hundido"
        >
          <X size={22} aria-hidden />
        </button>
      </div>
    </dialog>
  )
}
