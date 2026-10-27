import { Plug } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Lo que muestra un slot mientras no está conectado: dice qué se monta ahí y quién lo provee.
 * Nunca simula el contenido real.
 */
export function EsperaSlot({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed bg-papel-elevado/70 px-4 py-5 text-center">
      <Plug size={20} strokeWidth={2} aria-hidden />
      <p className="text-etiqueta">{titulo}</p>
      {children && <p className="max-w-80 text-meta text-tinta-suave">{children}</p>}
    </div>
  )
}
