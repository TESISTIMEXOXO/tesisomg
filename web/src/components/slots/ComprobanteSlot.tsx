import { ScanLine } from 'lucide-react'
import { useId } from 'react'
import { estilosBoton } from '../ui/estilosBoton'
import { EsperaSlot } from './EsperaSlot'

export type ComprobanteSlotProps = {
  /** Se manda el ticket, la captura o el PDF; el backend lo lee y arma el gasto (HU-22, release 3). */
  onEscanear: (archivo: File) => void
}

export function ComprobanteSlot({ onEscanear }: ComprobanteSlotProps) {
  const idInput = useId()
  return (
    <div className="flex flex-col gap-3 rounded-md trazo bg-papel-hundido p-4">
      <EsperaSlot titulo="Lectura de comprobantes">
        Pinz va a leer el monto, la fecha y los ítems. La lectura la hace el backend.
      </EsperaSlot>
      <label htmlFor={idInput} className={`${estilosBoton('secundario', 'sm')} has-focus-visible:outline-3 has-focus-visible:outline-offset-3`}>
        <ScanLine size={20} strokeWidth={2} aria-hidden />
        Escanear un comprobante
        <input
          id={idInput}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="sr-only"
          onChange={(evento) => {
            const archivo = evento.target.files?.[0]
            if (archivo) onEscanear(archivo)
            evento.target.value = ''
          }}
        />
      </label>
    </div>
  )
}
