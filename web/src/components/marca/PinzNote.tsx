import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PinzId, TonoPinz } from '../../pinz/elenco'
import { Button, ButtonLink } from '../ui/Button'
import { Pin } from './Pin'

type TipoNota = 'tip' | 'vacio' | 'error' | 'festejo'

type PinzNoteProps = {
  /** tip = consejo, vacio = estado vacío, error = 404 o algo que no cargó, festejo = algo salió bien. */
  tipo?: TipoNota
  /** El personaje de la sección (Vuelto en Cuentas…). Sin pinz va el genérico. */
  pinz?: PinzId
  /** Color del genérico; por defecto, el del tipo. */
  color?: TonoPinz
  /** fila = card chica (tip, festejo); bloque = centrado, para pantallas vacías y errores. */
  layout?: 'fila' | 'bloque'
  title?: string
  children?: ReactNode
  /** Texto de la acción, opcional. Va con onAction (botón) o con actionTo (link). */
  action?: string
  onAction?: () => void
  actionTo?: string
  /** Solo en tip: se cierra y no vuelve. */
  onClose?: () => void
  className?: string
}

const POR_TIPO: Record<TipoNota, { color: TonoPinz; layout: 'fila' | 'bloque'; fondo: string }> = {
  tip: { color: 'sol', layout: 'fila', fondo: 'bg-sol-tinte' },
  vacio: { color: 'lavanda', layout: 'bloque', fondo: 'bg-papel-elevado' },
  error: { color: 'cielo', layout: 'bloque', fondo: 'bg-papel-elevado' },
  festejo: { color: 'mar', layout: 'fila', fondo: 'bg-mar-tinte' },
}

/**
 * El único lugar donde aparece un pinz ilustrado dentro de la app. Uno por pantalla como máximo
 * (si hay un error y un tip, gana el error) y nunca en Emergencias.
 */
export function PinzNote({
  tipo = 'tip',
  pinz,
  color,
  layout,
  title,
  children,
  action,
  onAction,
  actionTo,
  onClose,
  className = '',
}: PinzNoteProps) {
  const base = POR_TIPO[tipo]
  const forma = layout ?? base.layout
  const enBloque = forma === 'bloque'
  const variante = enBloque ? 'primario' : 'secundario'

  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`relative flex items-center gap-4 ${
        enBloque
          ? 'flex-col px-4 py-8 text-center'
          : `rounded-lg trazo py-3.5 pr-11 pl-3.5 shadow-dura ${base.fondo}`
      } ${className}`}
    >
      <Pin
        pinz={pinz ?? 'generico'}
        color={color ?? base.color}
        size={enBloque ? 112 : 64}
        label=""
        className="motion-safe:animate-asoma"
      />
      <div className={`flex min-w-0 flex-col gap-1 ${enBloque ? 'max-w-75 items-center' : 'items-start'}`}>
        {title && (
          <p className={enBloque ? 'font-display text-titulo-2 font-black' : 'font-extrabold'}>{title}</p>
        )}
        {children && <p className={enBloque ? 'text-tinta-suave' : ''}>{children}</p>}
        {action && actionTo && (
          <ButtonLink to={actionTo} variant={variante} size="sm" className="mt-2">
            {action}
          </ButtonLink>
        )}
        {action && !actionTo && (
          <Button variant={variante} size="sm" onClick={onAction} className="mt-2">
            {action}
          </Button>
        )}
      </div>
      {tipo === 'tip' && onClose && (
        <button
          type="button"
          aria-label="Cerrar consejo"
          onClick={onClose}
          className="absolute top-1.5 right-1.5 grid size-toque place-items-center rounded-full hover:bg-tinta/10"
        >
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  )
}
