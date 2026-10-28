import type { PinzId } from '../pinz/elenco'

type Punto = readonly [number, number]

type GrupoAnclado = {
  /** El elemento con data-camino="<ancla>" que lleva el grupo; null = coordenadas absolutas. */
  ancla: string | null
  borde: 'arriba' | 'abajo' | null
  /** Dónde estaba ese borde en el diseño: los puntos se corren lo que se haya corrido el elemento. */
  yOriginal: number
  puntos: readonly Punto[]
}

/** La vuelta por fuera de pantalla entre dos grupos: x fija, y a mitad de camino entre los dos. */
type Vuelta = { fuera: number }

export type DatosCamino = {
  /** El ancho de pantalla en el que se dibujaron los puntos. */
  ancho: number
  grosor: number
  paso: number
  sigma: number
  cada: number
  /** En px por segundo. */
  velocidad: number
  plaza: { ancla: string; extraAncho: number; extraAlto: number }
  caminantes: readonly (readonly PinzId[])[]
  grupos: readonly (GrupoAnclado | Vuelta)[]
}

/** Los bordes de cada ancla, medidos desde arriba de la landing. */
export type Anclas = Record<string, { top: number; bottom: number }>

function esVuelta(grupo: GrupoAnclado | Vuelta): grupo is Vuelta {
  return 'fuera' in grupo
}

function distancia([x1, y1]: Punto, [x2, y2]: Punto) {
  return Math.hypot(x2 - x1, y2 - y1)
}

function guia(datos: DatosCamino, anclas: Anclas, escala: number): Punto[] {
  const tramos: (Punto[] | number)[] = []
  for (const grupo of datos.grupos) {
    if (esVuelta(grupo)) {
      tramos.push(grupo.fuera * escala)
      continue
    }
    let dy = 0
    if (grupo.ancla) {
      const ancla = anclas[grupo.ancla]
      if (!ancla) continue
      dy = (grupo.borde === 'abajo' ? ancla.bottom : ancla.top) - grupo.yOriginal
    }
    tramos.push(grupo.puntos.map(([x, y]) => [x * escala, y + dy] as const))
  }

  return tramos.flatMap((tramo, i) => {
    if (typeof tramo !== 'number') return tramo
    const anterior = tramos[i - 1]
    const siguiente = tramos[i + 1]
    if (typeof anterior === 'number' || typeof siguiente === 'number' || !anterior || !siguiente) return []
    const y = (anterior[anterior.length - 1][1] + siguiente[0][1]) / 2
    return [[tramo, y] as const]
  })
}

function remuestrear(puntos: Punto[], paso: number): Punto[] {
  const resultado: Punto[] = [puntos[0]]
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i - 1]
    const [x2, y2] = puntos[i]
    const partes = Math.max(1, Math.ceil(distancia(puntos[i - 1], puntos[i]) / paso))
    for (let k = 1; k <= partes; k++) {
      const t = k / partes
      resultado.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t])
    }
  }
  return resultado
}

/* Los dos primeros y los dos últimos quedan fijos: así el camino entra y termina donde dice la guía. */
function suavizar(puntos: Punto[], sigma: number): Punto[] {
  const radio = Math.ceil(sigma * 3)
  return puntos.map((punto, i) => {
    if (i < 2 || i > puntos.length - 3) return punto
    let x = 0
    let y = 0
    let total = 0
    for (let j = Math.max(0, i - radio); j <= Math.min(puntos.length - 1, i + radio); j++) {
      const peso = Math.exp(-((j - i) ** 2) / (2 * sigma ** 2))
      x += puntos[j][0] * peso
      y += puntos[j][1] * peso
      total += peso
    }
    return [x / total, y / total] as const
  })
}

function nodos(puntos: Punto[], cada: number): Punto[] {
  const elegidos = puntos.filter((_, i) => i % cada === 0)
  if ((puntos.length - 1) % cada !== 0) elegidos.push(puntos[puntos.length - 1])
  return elegidos
}

const redondo = (n: number) => Math.round(n * 10) / 10

/* Catmull-Rom pasado a cúbicas: la curva pasa por cada nodo, sin quiebres. */
function curva(puntos: Punto[]) {
  const [inicio] = puntos
  let d = `M${redondo(inicio[0])} ${redondo(inicio[1])}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${redondo(c1[0])} ${redondo(c1[1])}, ${redondo(c2[0])} ${redondo(c2[1])}, ${redondo(p2[0])} ${redondo(p2[1])}`
  }
  return d
}

/**
 * Arma el `d` del camino a partir de dónde quedaron las anclas en la página.
 * Las x se escalan del ancho del diseño al de la pantalla; las y siguen a las anclas.
 * `largo` es el recorrido en px, para que los pinz caminen siempre a la misma velocidad.
 */
export function armarCamino(datos: DatosCamino, anclas: Anclas, ancho: number) {
  const puntos = suavizar(remuestrear(guia(datos, anclas, ancho / datos.ancho), datos.paso), datos.sigma)
  if (puntos.length < 2) return null
  let largo = 0
  for (let i = 1; i < puntos.length; i++) largo += distancia(puntos[i - 1], puntos[i])
  return { d: curva(nodos(puntos, datos.cada)), largo }
}
