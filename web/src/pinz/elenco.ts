export const PINZ_IDS = [
  'chispa',
  'brujula',
  'vuelto',
  'siesta',
  'valija',
  'postal',
  'nono',
  'trasnoche',
  'morfi',
  'cumbre',
] as const

export type PinzId = (typeof PINZ_IDS)[number]

/* Tonos con los que se puede pintar un pinz: los de la paleta y los que se sumaron para el elenco. */
export type TonoPinz =
  | 'coral'
  | 'sol'
  | 'mar'
  | 'lavanda'
  | 'cielo'
  | 'durazno'
  | 'rosa'
  | 'arena'
  | 'noche'
  | 'mostaza'
  | 'bosque'

export type Personaje = {
  nombre: string
  apodo: string
  tono: TonoPinz
  acompana: string
  descripcion: string
  frase: string
}

export const ELENCO: Record<PinzId, Personaje> = {
  chispa: {
    nombre: 'Chispa',
    apodo: 'el de las ideas',
    tono: 'sol',
    acompana: 'Decidir · ideas guardadas',
    descripcion:
      'Propone planes todo el tiempo: la cascada escondida, la feria del domingo, el atardecer que no sale en ninguna guía.',
    frase: '¿Y si mañana vemos el atardecer en el Campanario?',
  },
  brujula: {
    nombre: 'Brújula',
    apodo: 'el analista',
    tono: 'cielo',
    acompana: 'Plan · itinerario y mapa',
    descripcion:
      'Si hay un horario, lo sabe. Compara rutas, calcula tiempos y avisa cuando dos planes se pisan.',
    frase: 'Si salimos 9:40, llegamos a la aerosilla sin fila.',
  },
  vuelto: {
    nombre: 'Vuelto',
    apodo: 'el contador',
    tono: 'durazno',
    acompana: 'Cuentas · gastos y saldos',
    descripcion:
      'Anota cada gasto en el momento y divide al centavo, pero sin pasar facturas: quedar a mano es una forma de cariño.',
    frase: 'Anotado. Con 5 pagos quedan todos a mano.',
  },
  siesta: {
    nombre: 'Siesta',
    apodo: 'el relajado',
    tono: 'mar',
    acompana: 'Hoy · durante el viaje',
    descripcion:
      'Viene a descansar y lo dice con orgullo. Le baja la ansiedad al grupo y recuerda que las vacaciones también son no hacer nada.',
    frase: 'Tranqui, el plan ya está. Disfrutá el día.',
  },
  valija: {
    nombre: 'Valija',
    apodo: 'la precavida',
    tono: 'rosa',
    acompana: 'Baúl · papeles y emergencias',
    descripcion:
      'Lleva lo que nadie llevó y lo comparte sin decir «te lo dije». Piensa en el clima, los papeles y el botiquín.',
    frase: '¿Tenés el DNI a mano? Te lo dejo en el Baúl, por las dudas.',
  },
  postal: {
    nombre: 'Postal',
    apodo: 'la memoriosa',
    tono: 'lavanda',
    acompana: 'Post-viaje · álbum y recuerdos',
    descripcion:
      'Guarda todo: fotos, entradas, el nombre del bar del primer día. Cuando termina el viaje, es la primera en decir «¿repetimos?».',
    frase: 'Junté las fotos de todos en un álbum.',
  },
  nono: {
    nombre: 'Nono',
    apodo: 'el madrugador',
    tono: 'arena',
    acompana: 'Hoy · horarios y alarmas',
    descripcion:
      'A las 22 ya está en la cama y a las 6 tiene el termo listo. Conoce atajos que no salen en el GPS.',
    frase: 'Mañana madrugamos, ¿eh? A las siete, desayuno.',
  },
  trasnoche: {
    nombre: 'Trasnoche',
    apodo: 'el nocturno',
    tono: 'noche',
    acompana: 'Decidir · y la vuelta segura de noche',
    descripcion:
      'Se despierta al mediodía y es el alma de la noche: sabe dónde está la peña y la pizza de las tres de la mañana.',
    frase: '¿Ya se van? Si recién empieza…',
  },
  morfi: {
    nombre: 'Morfi',
    apodo: 'la de la comida',
    tono: 'mostaza',
    acompana: 'Decidir · votaciones de comida',
    descripcion:
      'Organiza el viaje alrededor de las comidas: ya sabe dónde está la mejor trucha, el puesto de empanadas y la heladería.',
    frase: 'Primero comemos, después vemos.',
  },
  cumbre: {
    nombre: 'Cumbre',
    apodo: 'el aventurero',
    tono: 'bosque',
    acompana: 'Plan · actividades y equipo',
    descripcion:
      'Quiere subir todo lo que se pueda subir. Convence al grupo de «una caminata cortita» que termina siendo de seis horas.',
    frase: 'Es una caminata cortita, lo prometo.',
  },
}
