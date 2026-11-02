import { Camera, ScanLine } from 'lucide-react'
import { useId, type ChangeEvent } from 'react'
import { estilosBoton } from '../ui/estilosBoton'

export type ComprobanteSlotProps = {
  /** Se manda el ticket, la captura o el PDF; lo leído completa el formulario (HU-22). */
  onEscanear: (archivo: File) => void
  leyendo: boolean
  error: string | null
}

const ESTILO_BOTON = `${estilosBoton('secundario', 'sm')} has-focus-visible:outline-3 has-focus-visible:outline-offset-3`

export function ComprobanteSlot({ onEscanear, leyendo, error }: ComprobanteSlotProps) {
  const idCamara = useId()
  const idArchivo = useId()

  function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    if (archivo) onEscanear(archivo)
    evento.target.value = ''
  }

  return (
    <div className="flex flex-col gap-3 rounded-md trazo bg-papel-hundido p-4">
      <p>Sacale una foto al ticket: completamos el monto, la fecha y el lugar, y vos elegís quién pagó.</p>
      <div className="flex flex-wrap gap-2">
        {/* capture abre la cámara directo, pero en el celular no deja elegir de la galería: por eso son dos entradas. */}
        <label htmlFor={idCamara} className={ESTILO_BOTON}>
          <Camera size={20} strokeWidth={2} aria-hidden />
          {leyendo ? 'Leyendo…' : 'Sacar foto'}
          <input id={idCamara} type="file" accept="image/*" capture="environment" disabled={leyendo} className="sr-only" onChange={alElegir} />
        </label>
        <label htmlFor={idArchivo} className={ESTILO_BOTON}>
          <ScanLine size={20} strokeWidth={2} aria-hidden />
          Subir foto o PDF
          <input id={idArchivo} type="file" accept="image/*,application/pdf" disabled={leyendo} className="sr-only" onChange={alElegir} />
        </label>
      </div>
      {error && (
        <p role="alert" className="font-semibold text-negativo">
          {error}
        </p>
      )}
    </div>
  )
}
