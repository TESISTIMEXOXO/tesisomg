import { z } from 'zod'
import { pedir } from '../lib/api'
import { GastoSchema, type NuevoGasto } from '../types/gasto'
import { SaldosSchema } from '../types/saldo'

export async function listar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/gastos`, { schema: z.array(GastoSchema) })
}

/** Los saldos ya simplificados por el backend: el front no calcula quién le paga a quién. */
export async function saldos(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/gastos/saldos`, { schema: SaldosSchema })
}

export function agregar(viajeId: string, datos: NuevoGasto) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/gastos`, { method: 'POST', body: datos, schema: GastoSchema })
}

/** Marca como hecho el pago a otra persona; se aplica cuando quien lo recibe lo confirma. */
export function registrarPago(viajeId: string, personaId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/gastos/pagos`, { method: 'POST', body: { personaId } })
}

export function simplificar(viajeId: string) {
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/gastos/simplificar`, {
    method: 'POST',
    schema: z.object({ viajeId: z.string(), transferencias: z.array(z.object({ de: z.string(), a: z.string(), monto: z.number().int() })) }),
  })
}

/** Manda el comprobante para que el backend arme el gasto (HU-22). */
export function leerComprobante(viajeId: string, archivo: File) {
  const form = new FormData()
  form.set('archivo', archivo)
  return pedir(`/viajes/${encodeURIComponent(viajeId)}/documentos`, {
    method: 'POST',
    body: form,
    schema: z.object({ id: z.string() }),
  })
}
