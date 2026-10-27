import { z } from 'zod'
import { demora, gastos, saldos as saldosMock, sinBackend } from '../mocks/datos'
import { GastoSchema, type NuevoGasto } from '../types/gasto'
import { SaldosSchema } from '../types/saldo'

export async function listar(viajeId: string) {
  await demora()
  return z.array(GastoSchema).parse(gastos.filter((g) => g.viajeId === viajeId))
}

/** Los saldos ya simplificados por el backend: el front no calcula quién le paga a quién. */
export async function saldos(viajeId: string) {
  await demora()
  const datos = saldosMock.find((s) => s.viajeId === viajeId)
  if (!datos) throw new Error('No pudimos cargar las cuentas.')
  return SaldosSchema.parse(datos)
}

export function agregar(viajeId: string, datos: NuevoGasto) {
  return sinBackend('gastos.agregar', { viajeId, ...datos })
}

/** Marca como hecho el pago a otra persona; se aplica cuando quien lo recibe lo confirma. */
export function registrarPago(viajeId: string, personaId: string) {
  return sinBackend('gastos.registrarPago', { viajeId, personaId })
}

export function simplificar(viajeId: string) {
  return sinBackend('gastos.simplificar', { viajeId })
}

/** Manda el comprobante para que el backend arme el gasto (HU-22). */
export function leerComprobante(viajeId: string, archivo: File) {
  return sinBackend('gastos.leerComprobante', { viajeId, archivo: archivo.name })
}
