import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { monto } from '../../lib/moneda'
import { direccionDe, type DireccionSaldo } from '../../lib/saldo'
import type { PinzId } from '../../pinz/elenco'
import { AvatarStack } from './AvatarStack'

type BalanceRowProps = {
  name: string
  /** Positivo: te tienen que devolver. Negativo: te falta poner. */
  amount: number
  direction?: DireccionSaldo
  /** El pinz de esa persona: su avatar toma ese tono. */
  pinz?: PinzId | null
  /** Una acción al final de la fila, como "Pagar". */
  action?: ReactNode
}

const FRASE: Record<DireccionSaldo, (nombre: string) => string> = {
  'a-favor': (nombre) => `${nombre} te tiene que devolver`,
  pendiente: (nombre) => `Te falta poner con ${nombre}`,
  'a-mano': (nombre) => `Están a mano con ${nombre}`,
}

/** Siempre con signo y palabra, nunca solo color. Y sin la palabra "deber". */
export function BalanceRow({ name, amount, direction, pinz, action }: BalanceRowProps) {
  const direccion = direction ?? direccionDe(amount)
  return (
    <div className="flex min-h-14.5 flex-wrap items-center gap-x-3 gap-y-2 rounded-md trazo bg-papel-elevado px-4 py-2 shadow-chica">
      <AvatarStack people={[{ name, pinz }]} max={1} />
      <span className="min-w-0 flex-1 text-etiqueta font-semibold">{FRASE[direccion](name)}</span>
      {direccion === 'a-mano' ? (
        <Check size={18} strokeWidth={2} aria-label="a mano" className="text-tinta-suave" />
      ) : (
        <span
          className={`font-display text-titulo-2 font-black whitespace-nowrap numeros ${
            direccion === 'a-favor' ? 'text-positivo' : 'text-negativo'
          }`}
        >
          {direccion === 'a-favor' ? '+ ' : '− '}
          {monto(amount)}
        </span>
      )}
      {action && <div className="flex basis-full justify-end md:basis-auto">{action}</div>}
    </div>
  )
}
