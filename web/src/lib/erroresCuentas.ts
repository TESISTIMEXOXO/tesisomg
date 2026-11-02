import { ErrorApi } from './api'

const MENSAJES: Record<string, string> = {
  'sin-deuda-pendiente': 'No tenés nada para poner con esa persona.',
  'pago-ya-pendiente': 'Ya le avisaste de ese pago: falta que lo confirme.',
  'pago-ya-resuelto': 'Ese pago ya estaba resuelto.',
  'sin-permiso': 'No tenés permiso para hacer eso.',
  'no-existe': 'Eso ya no está. Actualizá la pantalla.',
}

/** El mensaje para cada código de error de las cuentas. */
export function mensajeDeCuentas(error: unknown) {
  const cuerpo = error instanceof ErrorApi ? (error.cuerpo as { error?: unknown } | null) : null
  const codigo = typeof cuerpo?.error === 'string' ? cuerpo.error : ''
  return MENSAJES[codigo] ?? 'No pudimos guardar el cambio. Revisá la conexión y probá de nuevo.'
}
