import type { PinzId } from '../pinz/elenco'

export type Punto = readonly [number, number]

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
  /**
   * El arco que rodea los botones de la barra: cuánto arranca a su izquierda, hasta qué altura baja y el aire mínimo con ellos.
   * Con `esquivaTitulo` baja menos si el título le quedaría debajo.
   */
  rodeo: { entrada: number; caida: number; aire: number; esquivaTitulo: boolean; caminantes: readonly (readonly PinzId[])[] }
  caminantes: readonly (readonly PinzId[])[]
  /** Cada cuánto sale un grupo, en anchos de pantalla: menos que lo que se ve de una pasada, así siempre hay alguno a la vista. */
  separacionGrupos: number
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
 * El camino corto de arriba a la derecha: un solo arco que baja desde el borde superior, pasa por debajo de los botones y sale horizontal por el costado.
 * No arranca antes de la x `tope`, y devuelve null si con ese lugar no llega a rodear los botones.
 * Se arma desde el borde real de los botones, que no escalan con la pantalla como el resto de la guía.
 */
export function armarRodeo(datos: DatosCamino, botones: { izquierda: number; abajo: number }, ancho: number, tope: number, titulo: { derecha: number; arriba: number } | null) {
  const { izquierda, abajo } = botones
  const { grosor } = datos
  const radioX = ancho - izquierda + Math.min(datos.rodeo.entrada, izquierda - tope - grosor / 2)
  const alturaEn = (x: number) => Math.sqrt(1 - ((ancho - x) / radioX) ** 2)

  if (ancho - izquierda >= radioX) return null
  const paraRodear = (abajo + grosor / 2 + datos.rodeo.aire) / alturaEn(izquierda)

  /* Lo más que puede bajar sin pasar por encima del título, que tiene que quedar debajo mientras la curva no lo pasó. */
  let radioY = datos.rodeo.caida
  if (titulo && ancho - titulo.derecha < radioX) {
    radioY = Math.min(radioY, (titulo.arriba - grosor / 2 - 6) / alturaEn(titulo.derecha))
  } else if (!titulo) {
    radioY = Math.min(radioY, paraRodear)
  }

  /* Sin lugar para abrirse, la curva le pasaría por encima a la esquina de los botones. */
  if (radioY < paraRodear) return null

  const inicioX = redondo(ancho - radioX)
  const afuera = grosor * 1.5
  /* El cuarto de elipse no tiene largo exacto: alcanza con la aproximación de Ramanujan, porque solo marca la velocidad de los pinz. */
  const largoArco = (Math.PI * (3 * (radioX + radioY) - Math.sqrt((3 * radioX + radioY) * (radioX + 3 * radioY)))) / 4
  return {
    d: `M${inicioX} ${-afuera} L${inicioX} 0 A${redondo(radioX)} ${redondo(radioY)} 0 0 0 ${redondo(ancho)} ${redondo(radioY)} L${redondo(ancho + afuera)} ${redondo(radioY)}`,
    largo: largoArco + afuera * 2,
  }
}

/** Los puntos de un `path` corto, a intervalos parejos. */
export function muestrear(d: string, paso: number): Punto[] {
  const camino = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  camino.setAttribute('d', d)
  const largo = camino.getTotalLength()
  const puntos: Punto[] = []
  for (let s = 0; s <= largo; s += paso) {
    const { x, y } = camino.getPointAtLength(s)
    puntos.push([x, y])
  }
  return puntos
}

/** Repite la lista de caminantes hasta cubrir el largo del camino con grupos a la separación pedida. */
export function repartirGrupos(datos: DatosCamino, largo: number, ancho: number) {
  const cantidad = Math.max(datos.caminantes.length, Math.round(largo / (ancho * datos.separacionGrupos)))
  return Array.from({ length: cantidad }, (_, i) => datos.caminantes[i % datos.caminantes.length])
}

/**
 * Arma el `d` del camino a partir de dónde quedaron las anclas en la página.
 * Las x se escalan del ancho del diseño al de la pantalla; las y siguen a las anclas.
 * `largo` es el recorrido en px, para que los pinz caminen siempre a la misma velocidad.
 * `finX` es dónde termina el camino, escondido detrás del botón final.
 * `puntos` lo recorre a intervalos parejos: alcanza para saber por dónde va un pinz sin medir el `path`, que en uno tan largo es caro.
 */
export function armarCamino(datos: DatosCamino, anclas: Anclas, ancho: number) {
  const puntos = suavizar(remuestrear(guia(datos, anclas, ancho / datos.ancho), datos.paso), datos.sigma)
  if (puntos.length < 2) return null
  let largo = 0
  for (let i = 1; i < puntos.length; i++) largo += distancia(puntos[i - 1], puntos[i])
  return { d: curva(nodos(puntos, datos.cada)), largo, finX: puntos[puntos.length - 1][0], puntos }
}
