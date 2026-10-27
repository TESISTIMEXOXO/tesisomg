import { direccionDe, ordenarSaldos } from '../../lib/saldo'
import type { Saldo } from '../../types/saldo'
import { BalanceRow } from '../ui/BalanceRow'
import { Button } from '../ui/Button'
import { EsperaSlot } from './EsperaSlot'

export type SaldosSlotProps = {
  /** Los saldos ya calculados por el backend (cuentas simplificadas). null mientras no llegan. */
  saldos: Saldo[] | null
  moneda: string
  onRegistrarPago?: (personaId: string) => void
}

/**
 * Slot de saldos. El cálculo de quién le paga a quién (tipo Splitwise) lo hace el backend:
 * acá solo se muestra el resultado, ordenado como pide la marca.
 */
export function SaldosSlot({ saldos, moneda, onRegistrarPago }: SaldosSlotProps) {
  if (!saldos) {
    return (
      <EsperaSlot titulo="Acá van los saldos">
        Los calcula el backend con las cuentas simplificadas, en {moneda}.
      </EsperaSlot>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {ordenarSaldos(saldos).map((saldo) => (
        <li key={saldo.persona.id}>
          <BalanceRow
            name={saldo.persona.nombre}
            pinz={saldo.persona.pinz}
            amount={saldo.monto}
            action={
              direccionDe(saldo.monto) === 'pendiente' && onRegistrarPago ? (
                <Button variant="secundario" size="sm" onClick={() => onRegistrarPago(saldo.persona.id)}>
                  Pagar
                </Button>
              ) : null
            }
          />
        </li>
      ))}
    </ul>
  )
}
