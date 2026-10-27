import type { PinzId } from '../../pinz/elenco'
import { PinzNote } from './PinzNote'

/** Mientras llegan los datos: el pinz de la sección, quieto, y una línea de texto. */
export function Cargando({ pinz, texto = 'Un momento, estamos trayendo los datos.' }: { pinz?: PinzId; texto?: string }) {
  return (
    <PinzNote tipo="vacio" pinz={pinz} title="Cargando…">
      {texto}
    </PinzNote>
  )
}

/** Algo no cargó. Va con el genérico, como todos los errores, y una salida. */
export function NoCargo({ error, onReintentar }: { error: Error | null; onReintentar?: () => void }) {
  return (
    <PinzNote
      tipo="error"
      title="No pudimos cargar esto"
      action={onReintentar ? 'Probar de nuevo' : undefined}
      onAction={onReintentar}
    >
      {error?.message ?? 'Revisá la conexión y probá de nuevo.'}
    </PinzNote>
  )
}
