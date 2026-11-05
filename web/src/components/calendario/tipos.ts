export type VistaCalendario = 'dia' | 'semana' | 'mes'

/** Los colores con los que se pinta cada destino: su cinta y sus actividades. */
export type TonoCalendario = 'coral' | 'mar' | 'lavanda' | 'cielo' | 'sol' | 'rosa'

export type ActividadCalendario = {
  id: string
  /** AAAA-MM-DD. */
  fecha: string
  /** HH:MM, hora local del destino. */
  hora: string
  /** HH:MM. Sin hora de fin, se dibuja de una hora. */
  horaFin: string | null
  titulo: string
  lugar: string | null
  hecha: boolean
  /** La que está pasando ahora: una sola, y solo durante el viaje. */
  ahora: boolean
  tono: TonoCalendario
}

/** Un destino del viaje entre dos fechas: se dibuja como una cinta de día completo. */
export type TramoCalendario = {
  id: string
  destino: string
  desde: string
  hasta: string
  tono: TonoCalendario
}

export type AccionesExportar = {
  onGoogle: () => void
  onIphone: () => void
  onDescargar: () => void
  cargando?: boolean
}
