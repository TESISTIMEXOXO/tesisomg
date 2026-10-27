export type DireccionSaldo = 'a-favor' | 'pendiente' | 'a-mano'

/** Positivo: te tienen que devolver. Negativo: te falta poner. Cero: están a mano. */
export function direccionDe(monto: number): DireccionSaldo {
  if (monto > 0) return 'a-favor'
  if (monto < 0) return 'pendiente'
  return 'a-mano'
}

const ORDEN: Record<DireccionSaldo, number> = { pendiente: 0, 'a-favor': 1, 'a-mano': 2 }

/** Primero lo que tenés que poner vos, después lo que te deben y al final con quién estás a mano. */
export function ordenarSaldos<T extends { monto: number }>(saldos: T[]) {
  return [...saldos].sort((a, b) => ORDEN[direccionDe(a.monto)] - ORDEN[direccionDe(b.monto)])
}
