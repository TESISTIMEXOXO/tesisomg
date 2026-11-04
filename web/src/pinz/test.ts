import { PINZ_IDS, type PinzId } from './elenco'

export type Opcion = {
  texto: string
  /** El pinz que más se parece a esta respuesta (suma 2) y el que se le acerca (suma 1). */
  suma: readonly [PinzId, PinzId]
}

export type Pregunta = {
  texto: string
  opciones: readonly Opcion[]
}

/* Las tres preguntas reparten los diez pinz como principales: cualquiera puede salir. */
export const PREGUNTAS: readonly Pregunta[] = [
  {
    texto: 'Llegan a un lugar nuevo. ¿Qué hacés primero?',
    opciones: [
      { texto: 'Busco todo lo que hay para ver y armo una lista', suma: ['chispa', 'cumbre'] },
      { texto: 'Pregunto dónde se come rico', suma: ['morfi', 'trasnoche'] },
      { texto: 'Reposera y mate. Lo demás, después', suma: ['siesta', 'morfi'] },
      { texto: 'Miro horarios y cómo llegar a cada lado', suma: ['brujula', 'valija'] },
    ],
  },
  {
    texto: '¿Qué no puede faltar en tu mochila?',
    opciones: [
      { texto: 'Botiquín, cargador y paraguas', suma: ['valija', 'nono'] },
      { texto: 'Zapatillas para caminar todo el día', suma: ['cumbre', 'brujula'] },
      { texto: 'Algo para picar, para todos', suma: ['morfi', 'siesta'] },
      { texto: 'Un cuaderno para pegar las entradas', suma: ['postal', 'chispa'] },
    ],
  },
  {
    texto: 'En el grupo, sos quien…',
    opciones: [
      { texto: 'Anota quién pagó qué', suma: ['vuelto', 'valija'] },
      { texto: 'Pregunta «¿y después?» a las once de la noche', suma: ['trasnoche', 'chispa'] },
      { texto: 'Se levanta primero y despierta al resto', suma: ['nono', 'cumbre'] },
      { texto: 'Saca la foto grupal aunque nadie quiera', suma: ['postal', 'siesta'] },
    ],
  },
]

/**
 * Suma los puntos de cada respuesta. En un empate gana la respuesta más reciente:
 * la última pregunta, el rol en el grupo, es la que mejor describe cómo viaja cada uno.
 */
export function calcularPinz(respuestas: readonly Opcion[]): PinzId {
  const puntos = new Map<PinzId, number>()
  const desempate: PinzId[] = []
  for (const { suma } of [...respuestas].reverse()) {
    const [principal, cercano] = suma
    puntos.set(principal, (puntos.get(principal) ?? 0) + 2)
    puntos.set(cercano, (puntos.get(cercano) ?? 0) + 1)
    desempate.push(principal, cercano)
  }
  let ganador: PinzId = desempate[0] ?? PINZ_IDS[0]
  for (const pinz of desempate) {
    if ((puntos.get(pinz) ?? 0) > (puntos.get(ganador) ?? 0)) ganador = pinz
  }
  return ganador
}
