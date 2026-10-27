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

export function diasHasta(fecha: string, hoy = new Date()) {
  const inicioDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((leerFecha(fecha).getTime() - inicioDeHoy.getTime()) / UN_DIA)
}
