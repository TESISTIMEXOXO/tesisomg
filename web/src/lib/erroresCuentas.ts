import { ErrorApi } from './api'

const MENSAJES: Record<string, string> = {
  'sin-deuda-pendiente': 'No tenés nada para poner con esa persona.',
  'pago-ya-pendiente': 'Ya le avisaste de ese pago: falta que lo confirme.',
  'pago-ya-resuelto': 'Ese pago ya estaba resuelto.',
  'consumos-no-suman': 'Lo que consumió cada uno tiene que sumar el monto.',
  'participante-no-es-miembro': 'Elegiste a alguien que ya no está en el viaje.',
  'selecciona-participantes': 'Elegí al menos una persona.',
  'datos-invalidos': 'Revisá los datos: el monto tiene que alcanzar para repartir entre todos.',
  'sin-permiso': 'No tenés permiso para hacer eso.',
  'no-existe': 'Eso ya no está. Actualizá la pantalla.',
}

function codigoDe(error: unknown) {
  const cuerpo = error instanceof ErrorApi ? (error.cuerpo as { error?: unknown } | null) : null
  return typeof cuerpo?.error === 'string' ? cuerpo.error : ''
}

/** Por qué no se pudo salir del grupo. */
export function mensajeAlSalir(error: unknown) {
  return codigoDe(error) === 'saldo-pendiente'
    ? 'Todavía tenés plata pendiente en Cuentas: quedá a mano y salí del grupo.'
    : 'No pudimos salir del grupo. Si sos organizador, primero transferí la organización.'
}

/** El mensaje para cada código de error de las cuentas. */
export function mensajeDeCuentas(error: unknown) {
  return MENSAJES[codigoDe(error)] ?? 'No pudimos guardar el cambio. Revisá la conexión y probá de nuevo.'
}
