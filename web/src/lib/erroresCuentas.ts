import { ErrorApi } from './api'

const MENSAJES: Record<string, string> = {
  'sin-deuda-pendiente': 'No tenés nada para poner con esa persona.',
  'pago-ya-pendiente': 'Ya le avisaste de ese pago: falta que lo confirme.',
  'pago-ya-resuelto': 'Ese pago ya estaba resuelto.',
  'consumos-no-suman': 'Lo que consumió cada uno tiene que sumar el monto.',
  'participante-no-es-miembro': 'Elegiste a alguien que ya no está en el viaje.',
  'selecciona-participantes': 'Elegí al menos una persona.',
  'datos-invalidos': 'Revisá los datos: el monto tiene que alcanzar para repartir entre todos.',
  'archivo-muy-grande': 'El archivo es muy pesado: probá con una foto más liviana.',
  'falta-archivo': 'Usá una foto JPG, PNG o WEBP, o un PDF.',
  'comprobante-ilegible': 'No pudimos leer el total. Probá con otra foto o cargalo a mano.',
  'lectura-no-disponible': 'La lectura de comprobantes todavía no está activada. Cargalo a mano.',
  'lectura-fallo': 'No pudimos leer el comprobante. Probá de nuevo o cargalo a mano.',
  'sin-permiso': 'No tenés permiso para hacer eso.',
  'no-existe': 'Eso ya no está. Actualizá la pantalla.',
}

function codigoDe(error: unknown) {
  const cuerpo = error instanceof ErrorApi ? (error.cuerpo as { error?: unknown } | null) : null
  return typeof cuerpo?.error === 'string' ? cuerpo.error : ''
}

/** Por qué no se pudo salir del grupo. */
export function mensajeAlSalir(error: unknown) {
  switch (codigoDe(error)) {
    case 'saldo-pendiente':
      return 'Todavía tenés plata pendiente en Cuentas: quedá a mano y salí del grupo.'
    case 'elegir-nuevo-organizador':
      return 'Elegí quién va a organizar el viaje cuando te vayas.'
    default:
      return 'No pudimos salir del grupo. Revisá la conexión y probá de nuevo.'
  }
}

/** Por qué no se pudo sacar a alguien del grupo. */
export function mensajeAlEchar(error: unknown, nombre: string) {
  switch (codigoDe(error)) {
    case 'saldo-pendiente':
      return `${nombre} todavía tiene plata pendiente en Cuentas: cuando quede a mano, lo vas a poder sacar.`
    case 'sin-permiso':
      return 'Solo quien organiza el viaje puede sacar a alguien.'
    case 'no-existe':
      return `${nombre} ya no está en el viaje. Actualizá la pantalla.`
    default:
      return `No pudimos sacar a ${nombre}. Revisá la conexión y probá de nuevo.`
  }
}

/** El mensaje para cada código de error de las cuentas. */
export function mensajeDeCuentas(error: unknown) {
  return MENSAJES[codigoDe(error)] ?? 'No pudimos guardar el cambio. Revisá la conexión y probá de nuevo.'
}
