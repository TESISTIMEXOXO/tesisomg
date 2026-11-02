import { ScanLine } from 'lucide-react'
import { useId } from 'react'
import { estilosBoton } from '../ui/estilosBoton'

export type ComprobanteSlotProps = {
  /** Se manda el ticket, la captura o el PDF; lo leído completa el formulario (HU-22). */
  onEscanear: (archivo: File) => void
  leyendo: boolean
  error: string | null
}

export function ComprobanteSlot({ onEscanear, leyendo, error }: ComprobanteSlotProps) {
  const idInput = useId()
  return (
    <div className="flex flex-col gap-3 rounded-md trazo bg-papel-hundido p-4">
      <p>Sacale una foto al ticket: completamos el monto, la fecha y el lugar, y vos elegís quién pagó.</p>
      <label htmlFor={idInput} className={`${estilosBoton('secundario', 'sm')} has-focus-visible:outline-3 has-focus-visible:outline-offset-3`}>
        <ScanLine size={20} strokeWidth={2} aria-hidden />
        {leyendo ? 'Leyendo…' : 'Escanear un comprobante'}
        <input
          id={idInput}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          disabled={leyendo}
          className="sr-only"
          onChange={(evento) => {
            const archivo = evento.target.files?.[0]
            if (archivo) onEscanear(archivo)
            evento.target.value = ''
          }}
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-negativo">
          {error}
        </p>
      )}
    </div>
  )
}
