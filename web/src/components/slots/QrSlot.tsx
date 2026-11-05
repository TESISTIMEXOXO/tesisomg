import { QRCodeSVG } from 'qrcode.react'

export type QrSlotProps = {
  /** El link de invitación que va codificado en el QR. */
  valor: string
  /** Para cambiar el tamaño: por defecto ocupa el ancho disponible, hasta max-w-60. */
  className?: string
}

/**
 * El QR del link de invitación: se escanea con la cámara del teléfono y abre la vista para sumarse.
 * Siempre negro sobre blanco, también en tema oscuro, porque muchas cámaras no leen los QR invertidos.
 */
export function QrSlot({ valor, className = 'max-w-60' }: QrSlotProps) {
  return (
    <figure className={`flex w-full flex-col items-center gap-3 rounded-lg trazo bg-papel-elevado p-5 text-center shadow-dura ${className}`}>
      <div className="w-full rounded-md bg-white p-3">
        <QRCodeSVG value={valor} size={256} level="M" marginSize={0} bgColor="#ffffff" fgColor="#1c1b22" title="QR para unirse al viaje" className="block h-auto w-full" />
      </div>
      <figcaption className="text-meta text-tinta-suave">Escanealo con la cámara del teléfono para sumarte.</figcaption>
    </figure>
  )
}
