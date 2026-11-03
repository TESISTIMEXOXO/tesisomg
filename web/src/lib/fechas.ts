const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const UN_DIA = 24 * 60 * 60 * 1000

/** Las fechas llegan como AAAA-MM-DD y se leen en la hora local, sin corrimientos por huso. */
export function leerFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

/** "14 – 21 ene 2027", "28 ene – 3 feb 2027" o "28 dic 2026 – 3 ene 2027". */
export function rangoDeFechas(ida: string | null, vuelta: string | null) {
  if (!ida) return 'Sin fechas todavía'
  const desde = leerFecha(ida)
  if (!vuelta) return `Desde el ${desde.getDate()} ${MESES[desde.getMonth()]} ${desde.getFullYear()}`
  const hasta = leerFecha(vuelta)
  const final = `${hasta.getDate()} ${MESES[hasta.getMonth()]} ${hasta.getFullYear()}`
  if (desde.getFullYear() !== hasta.getFullYear()) {
    return `${desde.getDate()} ${MESES[desde.getMonth()]} ${desde.getFullYear()} – ${final}`
  }
  if (desde.getMonth() !== hasta.getMonth()) return `${desde.getDate()} ${MESES[desde.getMonth()]} – ${final}`
  return `${desde.getDate()} – ${final}`
}

/** "Feb 2026", para los viajes pasados. */
export function mesYAnio(fecha: string) {
  const d = leerFecha(fecha)
  const mes = MESES[d.getMonth()]
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${d.getFullYear()}`
}

/** "2 mar 2027". */
export function fechaCorta(fecha: string) {
  const d = leerFecha(fecha)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

/** "sáb 16 ene". */
export function diaCorto(fecha: string) {
  const d = leerFecha(fecha)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

/**
 * El backend cuenta los movimientos solo en horas ("hace 30 horas"). Desde las 24 pasa a días: "hace 1 día".
 * Lo que no sea una cuenta de horas ("esta hora") queda como llegó.
 */
export function cuandoEnDias(cuando: string) {
  const horas = Number(/^hace (\d+) horas?$/.exec(cuando)?.[1])
  if (!(horas >= 24)) return cuando
  const dias = Math.floor(horas / 24)
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function diasHasta(fecha: string, hoy = new Date()) {
  const inicioDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((leerFecha(fecha).getTime() - inicioDeHoy.getTime()) / UN_DIA)
}

function aISO(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function hoyISO(hoy = new Date()) {
  return aISO(hoy)
}

/** Si ese día a esa hora (HH:MM) ya pasó, con la hora del dispositivo. */
export function yaPaso(fecha: string, hora: string, ahora = new Date()) {
  return new Date(`${fecha}T${hora}`) <= ahora
}

export function sumarDias(fecha: string, dias: number) {
  const d = leerFecha(fecha)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}

/** El mismo día en otro mes; si no existe (31 de febrero), el último del mes. */
export function sumarMeses(fecha: string, meses: number) {
  const d = leerFecha(fecha)
  const destino = new Date(d.getFullYear(), d.getMonth() + meses, 1)
  const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate()
  destino.setDate(Math.min(d.getDate(), ultimo))
  return aISO(destino)
}

/** Los siete días de la semana de esa fecha, de lunes a domingo. */
export function diasDeLaSemana(fecha: string) {
  const lunes = sumarDias(fecha, -((leerFecha(fecha).getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

/** Todos los días de la grilla del mes, con las semanas completas. */
export function semanasDelMes(fecha: string) {
  const d = leerFecha(fecha)
  const ultimo = aISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  const dias: string[] = []
  let lunes = diasDeLaSemana(aISO(new Date(d.getFullYear(), d.getMonth(), 1)))[0] as string
  while (lunes <= ultimo) {
    dias.push(...diasDeLaSemana(lunes))
    lunes = sumarDias(lunes, 7)
  }
  return dias
}

/** "Faltan 12 días": el título de Inicio antes de salir. */
export function tituloPrevaje(fechaIda: string | null, hoy = new Date()) {
  if (!fechaIda) return 'Todavía sin fechas'
  const faltan = diasHasta(fechaIda, hoy)
  if (faltan <= 0) return 'Hoy'
  return faltan === 1 ? 'Falta 1 día' : `Faltan ${faltan} días`
}
