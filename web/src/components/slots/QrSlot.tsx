import { QrCode } from 'lucide-react'

export type QrSlotProps = {
  /** El link de invitación que va codificado en el QR. */
  valor: string
}

/** Contenedor cuadrado del QR. El dibujo lo pone una librería de QR o el backend. */
export function QrSlot({ valor }: QrSlotProps) {
  return (
    <figure className="flex aspect-square w-full max-w-60 flex-col items-center justify-center gap-2 rounded-lg trazo bg-papel-elevado p-5 text-center shadow-dura">
      <QrCode size={40} strokeWidth={2} aria-hidden />
      <figcaption className="flex flex-col gap-1">
        <span className="text-etiqueta">Acá va el QR del viaje</span>
        <span className="text-meta break-all text-tinta-suave">Codifica {valor}</span>
      </figcaption>
    </figure>
  )
}
