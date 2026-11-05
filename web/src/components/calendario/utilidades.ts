import { useSyncExternalStore } from 'react'
import { leerFecha, rangoDeFechas, sumarDias } from '../../lib/fechas'
import type { ActividadCalendario, TonoCalendario, TramoCalendario, VistaCalendario } from './tipos'

/* Las clases enteras, escritas acá, para que Tailwind las encuentre. */
/* "suave" es el color a baja opacidad y no el -tinte: un -tinte vuelve claro todo lo que tiene adentro en el tema oscuro. */
export const TONOS: Record<TonoCalendario, { lleno: string; suave: string }> = {
  coral: { lleno: 'bg-coral', suave: 'bg-coral/15' },
  mar: { lleno: 'bg-mar', suave: 'bg-mar/15' },
  lavanda: { lleno: 'bg-lavanda', suave: 'bg-lavanda/18' },
  cielo: { lleno: 'bg-cielo', suave: 'bg-cielo/18' },
  sol: { lleno: 'bg-sol', suave: 'bg-sol/20' },
  rosa: { lleno: 'bg-rosa', suave: 'bg-rosa/15' },
}

/** El orden en que se reparten los colores entre los destinos del viaje. */
export const ORDEN_TONOS: TonoCalendario[] = ['coral', 'mar', 'lavanda', 'cielo', 'sol', 'rosa']

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export const DIAS_CORTOS_LUNES = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

export const NOMBRES_VISTA: Record<VistaCalendario, string> = { dia: 'Día', semana: 'Semana', mes: 'Mes' }

/** "09:40" → 580. */
export function minutos(hora: string) {
  const [h = 0, m = 0] = hora.split(':').map(Number)
  return h * 60 + m
}

export function horaDe(minutosDelDia: number) {
  const h = Math.floor(minutosDelDia / 60)
  const m = minutosDelDia % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Dónde termina: su hora de fin o una hora después, sin pasar la medianoche y con 15 minutos como mínimo. */
export function finDe(actividad: Pick<ActividadCalendario, 'hora' | 'horaFin'>) {
  const inicio = minutos(actividad.hora)
  const fin = actividad.horaFin ? minutos(actividad.horaFin) : inicio + 60
  return Math.min(24 * 60, Math.max(fin, inicio + 15))
}

export type ActividadUbicada = { actividad: ActividadCalendario; columna: number; columnas: number }

/**
 * Las actividades de un día, repartidas en columnas cuando se pisan, como en Google Calendar:
 * cada grupo de actividades encadenadas se divide en tantas columnas como necesite su peor momento.
 */
export function acomodar(actividades: ActividadCalendario[]): ActividadUbicada[] {
  const ordenadas = [...actividades].sort((a, b) => minutos(a.hora) - minutos(b.hora) || finDe(b) - finDe(a))
  const ubicadas: ActividadUbicada[] = []
  let grupo: ActividadUbicada[] = []
  let finesPorColumna: number[] = []
  let finDelGrupo = -1

  const cerrarGrupo = () => {
    for (const ubicada of grupo) ubicada.columnas = finesPorColumna.length
    grupo = []
    finesPorColumna = []
  }

  for (const actividad of ordenadas) {
    const inicio = minutos(actividad.hora)
    if (inicio >= finDelGrupo) cerrarGrupo()
    let columna = finesPorColumna.findIndex((fin) => fin <= inicio)
    if (columna === -1) columna = finesPorColumna.push(0) - 1
    finesPorColumna[columna] = finDe(actividad)
    finDelGrupo = Math.max(finDelGrupo, finDe(actividad))
    const ubicada = { actividad, columna, columnas: 1 }
    grupo.push(ubicada)
    ubicadas.push(ubicada)
  }
  cerrarGrupo()
  return ubicadas
}

export function porFecha(actividades: ActividadCalendario[], fecha: string) {
  return actividades.filter((actividad) => actividad.fecha === fecha).sort((a, b) => minutos(a.hora) - minutos(b.hora))
}

/** Qué tramo del viaje cae ese día (el último que ya empezó, si dos se tocan). */
export function tramoDelDia(tramos: TramoCalendario[], fecha: string) {
  return tramos.filter((tramo) => tramo.desde <= fecha && fecha <= tramo.hasta).at(-1) ?? null
}

/** "Día 3 de 7" dentro del viaje, o null fuera de él. */
export function diaDelViaje(tramos: TramoCalendario[], fecha: string) {
  if (!tramos.length) return null
  const inicio = tramos.reduce((menor, tramo) => (tramo.desde < menor ? tramo.desde : menor), tramos[0].desde)
  const fin = tramos.reduce((mayor, tramo) => (tramo.hasta > mayor ? tramo.hasta : mayor), tramos[0].hasta)
  if (fecha < inicio || fecha > fin) return null
  const dias = (desde: string, hasta: string) => Math.round((leerFecha(hasta).getTime() - leerFecha(desde).getTime()) / 86_400_000)
  return { numero: dias(inicio, fecha) + 1, total: dias(inicio, fin) + 1 }
}

/**
 * Las cintas de los destinos dentro de una fila de días (una semana): en qué columnas empiezan y terminan
 * y en qué carril van, para que dos destinos que comparten el día del cambio no se tapen.
 */
export function cintasDeLaFila(tramos: TramoCalendario[], dias: string[]) {
  const primero = dias[0]
  const ultimo = dias.at(-1)
  if (!primero || !ultimo) return { cintas: [], carriles: 0 }
  const finesPorCarril: number[] = []
  const cintas = tramos
    .filter((tramo) => tramo.desde <= ultimo && tramo.hasta >= primero)
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .map((tramo) => {
      const desde = Math.max(0, dias.indexOf(tramo.desde < primero ? primero : tramo.desde))
      const hasta = dias.indexOf(tramo.hasta > ultimo ? ultimo : tramo.hasta)
      let carril = finesPorCarril.findIndex((fin) => fin < desde)
      if (carril === -1) carril = finesPorCarril.push(0) - 1
      finesPorCarril[carril] = hasta
      return { tramo, desde, hasta, carril, sigueAntes: tramo.desde < primero, sigueDespues: tramo.hasta > ultimo }
    })
  return { cintas, carriles: finesPorCarril.length }
}

function conMayuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** El título de la barra: "Jueves 5 de noviembre", "2 – 8 nov 2026" o "Noviembre 2026". */
export function tituloDelPeriodo(vista: VistaCalendario, fecha: string, dias: string[]) {
  const d = leerFecha(fecha)
  if (vista === 'mes') return `${conMayuscula(MESES_LARGOS[d.getMonth()])} ${d.getFullYear()}`
  if (vista === 'semana') return rangoDeFechas(dias[0] ?? fecha, dias.at(-1) ?? fecha)
  return `${conMayuscula(DIAS_LARGOS[d.getDay()])} ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`
}

/** "jueves 5 de noviembre", para los textos accesibles. */
export function fechaLarga(fecha: string) {
  const d = leerFecha(fecha)
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`
}

export function diaDelMes(fecha: string) {
  return leerFecha(fecha).getDate()
}

export function diaDeLaSemanaCorto(fecha: string) {
  return DIAS_CORTOS_LUNES[(leerFecha(fecha).getDay() + 6) % 7]
}

export function moverFecha(vista: VistaCalendario, fecha: string, direccion: 1 | -1) {
  if (vista === 'dia') return sumarDias(fecha, direccion)
  if (vista === 'semana') return sumarDias(fecha, direccion * 7)
  const d = leerFecha(fecha)
  const destino = new Date(d.getFullYear(), d.getMonth() + direccion, 1)
  return `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}-01`
}

const CONSULTA_CELULAR = '(max-width: 767px)'

function suscribirseAlAncho(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_CELULAR)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

/** Si la pantalla es de celular (debajo de md): la semana pasa a lista y el mes, a puntos. */
export function useEsCelular() {
  return useSyncExternalStore(
    suscribirseAlAncho,
    () => window.matchMedia(CONSULTA_CELULAR).matches,
    () => false,
  )
}
