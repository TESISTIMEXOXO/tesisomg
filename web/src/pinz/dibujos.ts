import type { PinzId } from './elenco'

/*
 * El dibujo de los pinz, en el sistema de coordenadas del molde (viewBox VIEWBOX_PINZ).
 * Cada personaje se pinta en capas: lo que va detrás del cuerpo (brazos, mochila),
 * la sombra y el cuerpo en su tono, lo que va recortado dentro de la silueta
 * y, al final, la cara y los accesorios.
 */

export const SILUETA =
  'M60 129 Q56.5 129 54.6 125.4 C 46 110, 18 88, 18 54 A 42 42 0 1 1 102 54 C 102 88, 74 110, 65.4 125.4 Q63.5 129 60 129 Z'

export const VIEWBOX_PINZ = '-28 -26 176 176'

type ColorPaleta =
  | 'tinta'
  | 'tinta-suave'
  | 'papel-elevado'
  | 'coral'
  | 'sol'
  | 'sol-tinte'
  | 'mar'
  | 'lavanda'
  | 'cielo'
  | 'durazno'
  | 'rosa'
  | 'arena'
  | 'noche'
  | 'mostaza'
  | 'bosque'
  | 'rosa-mejilla'

/* Colores de accesorios que no son de la paleta de la interfaz: viven solo en la ilustración. */
const DETALLE = {
  cruz: '#e2553a',
  visera: '#2fa588',
  limon: '#c6e86b',
  gajo: '#8fb33a',
  camara: '#3a3946',
  boina: '#4a4858',
  boinaBrillo: '#6c6a7c',
  madera: '#b07a45',
  pulsera: '#9df5d6',
  pliegue: '#d9d3c7',
  croissant: '#f2b866',
  croissantBorde: '#c98a3a',
  lana: '#d9a92a',
} as const

export type Pintura = ColorPaleta | (typeof DETALLE)[keyof typeof DETALLE] | 'none'

export type Trazo = {
  etiqueta: 'path' | 'circle' | 'ellipse' | 'rect' | 'g'
  atributos: Record<string, string | number>
  hijos?: Trazo[]
}

export type Dibujo = {
  detras: Trazo[]
  recortado?: Trazo[]
  delante: Trazo[]
}

const PUNTAS = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function el(etiqueta: Trazo['etiqueta'], atributos: Trazo['atributos'], hijos?: Trazo[]): Trazo {
  return { etiqueta, atributos, hijos }
}

function linea(d: string, grosor: number, color: Pintura = 'tinta'): Trazo {
  return el('path', { d, fill: 'none', stroke: color, strokeWidth: grosor, ...PUNTAS })
}

function forma(d: string, relleno: Pintura, grosor?: number): Trazo {
  return grosor === undefined
    ? el('path', { d, fill: relleno })
    : el('path', { d, fill: relleno, stroke: 'tinta', strokeWidth: grosor, ...PUNTAS })
}

function circulo(cx: number, cy: number, r: number, relleno: Pintura, grosor: number): Trazo {
  return el('circle', { cx, cy, r, fill: relleno, stroke: 'tinta', strokeWidth: grosor, ...PUNTAS })
}

function rectangulo(x: number, y: number, width: number, height: number, rx: number, relleno: Pintura, grosor: number): Trazo {
  return el('rect', { x, y, width, height, rx, fill: relleno, stroke: 'tinta', strokeWidth: grosor, ...PUNTAS })
}

function grupo(transform: string, hijos: Trazo[]): Trazo {
  return el('g', { transform }, hijos)
}

function ojo(cx: number, cy: number, rx: number, ry: number): Trazo {
  return el('ellipse', { cx, cy, rx, ry, fill: 'tinta' })
}

function mejilla(cx: number, cy: number): Trazo {
  return el('circle', { cx, cy, r: 5.5, fill: 'rosa-mejilla', opacity: 0.45 })
}

/* Las manos son redondas y del tono del personaje. */
function mano(cx: number, cy: number, tono: Pintura): Trazo {
  return circulo(cx, cy, 6, tono, 4)
}

export const CARA_GENERICA: Trazo[] = [
  ojo(46, 50, 5, 7),
  ojo(74, 50, 5, 7),
  linea('M47 67 Q60 79 73 67', 5),
  mejilla(36, 64),
  mejilla(84, 64),
]

export const DIBUJOS: Record<PinzId, Dibujo> = {
  chispa: {
    detras: [
      linea('M26.5 86 Q8 92 4 104', 5),
      linea('M101.5 62 Q114 58 118 36', 5),
    ],
    delante: [
      ojo(46, 48, 5, 7),
      ojo(74, 48, 5, 7),
      forma('M45 64 Q60 84 75 64 Z', 'tinta', 4),
      forma('M53 73 Q60 68 67 73 Q60 79 53 73 Z', 'rosa-mejilla'),
      mejilla(36, 62),
      mejilla(84, 62),
      forma('M136 0 Q136 12 148 12 Q136 12 136 24 Q136 12 124 12 Q136 12 136 0 Z', 'sol', 3.5),
      el('circle', { cx: 108, cy: 4, r: 3.5, fill: 'tinta' }),
      mano(4, 104, 'sol'),
      mano(118, 36, 'sol'),
    ],
  },
  brujula: {
    detras: [
      forma('M60 -14 L67 3 L60 14 L53 3 Z', 'coral', 4),
      linea('M25.5 84 Q14 90 6 92', 5),
      linea('M93.5 86 Q112 92 116 104', 5),
    ],
    delante: [
      linea('M33.5 48 L21.0 45 M86.5 48 L99.0 45', 4),
      el('circle', { cx: 45, cy: 50, r: 11.5, fill: 'papel-elevado', fillOpacity: 0.55, stroke: 'tinta', strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      el('circle', { cx: 75, cy: 50, r: 11.5, fill: 'papel-elevado', fillOpacity: 0.55, stroke: 'tinta', strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      linea('M56.5 49 Q60 45 63.5 49', 4),
      ojo(46, 51, 3.6, 4.6),
      ojo(76, 51, 3.6, 4.6),
      linea('M51 70 Q60 77 69 70', 5),
      mejilla(36, 66),
      mejilla(84, 66),
      grupo('rotate(-8 -6 94)', [
        forma('M-26 80 L-15 76 L-4 80 L7 76 L7 106 L-4 110 L-15 106 L-26 110 Z', 'papel-elevado', 4),
        linea('M-15 76 V106 M-4 80 V110', 3),
        el('path', { d: 'M-21 102 Q-14 92 -7 97 Q0 101 1 89', fill: 'none', stroke: 'coral', strokeWidth: 3, strokeLinecap: 'round', strokeDasharray: '1 5' }),
        linea('M-2 82 L4 88 M4 82 L-2 88', 3, DETALLE.cruz),
      ]),
      mano(6, 92, 'cielo'),
      mano(116, 104, 'cielo'),
    ],
  },
  vuelto: {
    detras: [
      linea('M25.5 84 Q10 86 2 88', 5),
      linea('M94.5 84 Q106 90 112 98', 5),
    ],
    recortado: [
      forma('M-10 -20 H130 V40 Q60 22 -10 40 Z', 'mar', 4),
      linea('M60 8 V30', 3),
    ],
    delante: [
      ojo(46, 57, 5, 7),
      linea('M66 57 Q74 50 82 57', 5),
      linea('M48 71 Q60 83 72 71', 5),
      mejilla(36, 69),
      mejilla(84, 69),
      forma('M14 38 Q60 22 106 38 Q60 60 14 38 Z', DETALLE.visera, 4.5),
      grupo('rotate(-8 -10 96)', [
        forma('M-24 72 H0 V120 L-4 116 L-8 120 L-12 116 L-16 120 L-20 116 L-24 120 Z', 'papel-elevado', 4),
        linea('M-19 82 H-5 M-19 90 H-5 M-19 98 H-9 M-19 106 H-5', 3, 'tinta-suave'),
      ]),
      circulo(126, 100, 13, 'sol', 4),
      linea('M131 93 Q126 90 122 92.5 Q118 96 124 99 Q131 101.5 129.5 106 Q126 109.5 120 106.5 M125.5 88.5 V111.5', 3.2),
      mano(2, 88, 'durazno'),
      mano(112, 98, 'durazno'),
    ],
  },
  siesta: {
    detras: [
      linea('M26.5 86 Q8 92 4 104', 5),
      linea('M93.5 86 Q106 96 112 100', 5),
    ],
    delante: [
      forma('M28 44 H92 V52 Q90 63 77 63 Q66 63 64 52 H56 Q54 63 43 63 Q30 63 28 52 Z', 'tinta'),
      linea('M36 47 L42 47 M70 47 L76 47', 3, 'tinta-suave'),
      linea('M48 69 Q60 81 72 69', 5),
      mejilla(36, 68),
      mejilla(84, 68),
      linea('M128 84 L133 66 L140 64', 7.5),
      linea('M128 84 L133 66 L140 64', 3.5, 'coral'),
      forma('M112 82 L116 114 H130 L134 82 Z', 'sol-tinte', 4),
      forma('M113.4 92 L132.6 92 L130 112 H116 Z', 'sol'),
      linea('M112 82 L116 114 H130 L134 82 Z', 4),
      linea('M113.2 92 H132.8', 2.5),
      circulo(133, 82, 7, DETALLE.limon, 3.5),
      linea('M133 77 V87 M128 82 H138', 2, DETALLE.gajo),
      mano(4, 104, 'mar'),
      mano(112, 100, 'mar'),
    ],
  },
  valija: {
    detras: [
      linea('M24.5 82 Q6 80 -10 82', 5),
      linea('M99.3 72 Q112 68 120 70', 5),
    ],
    delante: [
      ojo(46, 52, 5, 7),
      ojo(74, 52, 5, 7),
      forma('M46 66 Q60 86 74 66 Z', 'tinta', 4),
      forma('M53 75 Q60 70 67 75 Q60 81 53 75 Z', 'rosa-mejilla'),
      mejilla(36, 64),
      mejilla(84, 64),
      forma('M30 24 L37 2 Q60 -4 83 2 L90 24 Q60 16 30 24 Z', 'papel-elevado', 4),
      linea('M60 6 V18 M54 12 H66', 4, DETALLE.cruz),
      linea('M-17 92 Q-17 80 -10 80 Q-3 80 -3 92', 4),
      rectangulo(-26, 90, 32, 24, 6, 'papel-elevado', 4),
      linea('M-10 96 V108 M-16 102 H-4', 4, DETALLE.cruz),
      linea('M122 68 V124', 4),
      forma('M122 126 L113 80 Q122 72 131 80 Z', 'cielo', 4),
      linea('M122 68 Q122 58 115 60', 4),
      mano(-10, 82, 'rosa'),
      mano(120, 70, 'rosa'),
    ],
  },
  postal: {
    detras: [
      linea('M24.5 82 Q12 84 6 86', 5),
      linea('M101.2 64 Q114 60 118 48', 5),
    ],
    recortado: [
      linea('M10 70 Q36 90 48 92 M110 70 Q84 90 72 92', 4),
    ],
    delante: [
      linea('M38 52 Q46 58 54 52', 5),
      linea('M66 52 Q74 58 82 52', 5),
      linea('M50 66 Q60 78 70 66', 5),
      mejilla(36, 62),
      mejilla(84, 62),
      rectangulo(44, 86, 32, 22, 6, DETALLE.camara, 4),
      rectangulo(49, 82, 9, 6, 2, DETALLE.camara, 3),
      circulo(60, 97, 7, 'cielo', 3.5),
      el('circle', { cx: 58, cy: 95, r: 2, fill: 'papel-elevado' }),
      forma('M126 14 Q126 4 134 4 Q141 4 140 12 Q139 20 126 28 Q113 20 112 12 Q111 4 118 4 Q126 4 126 14 Z', 'coral', 3.5),
      grupo('translate(4 0) rotate(-10 -8 86)', [
        rectangulo(-30, 72, 38, 26, 3, 'papel-elevado', 4),
        el('rect', { x: -25, y: 77, width: 15, height: 15, fill: 'cielo', stroke: 'tinta', strokeWidth: 2.5 }),
        el('path', { d: 'M-25 92 L-19 84 L-15 88 L-10 82 V92 Z', fill: 'mar', stroke: 'tinta', strokeWidth: 2 }),
        el('rect', { x: -4, y: 76, width: 8, height: 9, fill: 'none', stroke: 'coral', strokeWidth: 2, strokeDasharray: '2 1.6' }),
        linea('M-5 90 H4', 2.5),
      ]),
      mano(6, 86, 'lavanda'),
      mano(118, 48, 'lavanda'),
    ],
  },
  nono: {
    detras: [
      linea('M25.5 84 Q12 82 6 80', 5),
      linea('M93.5 86 Q106 92 112 96', 5),
    ],
    delante: [
      forma('M33 41 Q40 33 53 38 Q44 41 33 41 Z', 'papel-elevado', 3),
      forma('M87 41 Q80 33 67 38 Q76 41 87 41 Z', 'papel-elevado', 3),
      el('circle', { cx: 45, cy: 53, r: 10, fill: 'papel-elevado', fillOpacity: 0.5, stroke: 'tinta', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      el('circle', { cx: 75, cy: 53, r: 10, fill: 'papel-elevado', fillOpacity: 0.5, stroke: 'tinta', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      linea('M55 52 Q60 49 65 52', 3.5),
      linea('M39 54 Q45 60 51 54', 4),
      linea('M69 54 Q75 60 81 54', 4),
      forma('M42 72 Q50 62 60 68 Q70 62 78 72 Q70 78 60 73 Q50 78 42 72 Z', 'papel-elevado', 3.5),
      linea('M56 80 Q60 83 64 80', 3.5),
      mejilla(36, 64),
      mejilla(84, 64),
      linea('M60 8 V-2', 5),
      forma('M14 36 Q16 6 60 6 Q104 6 106 36 Q60 46 14 36 Z', DETALLE.boina, 4),
      linea('M30 22 Q46 14 62 14', 3, DETALLE.boinaBrillo),
      linea('M6 128 V76 Q6 64 -2 64 Q-9 64 -9 71', 8.5),
      linea('M6 128 V76 Q6 64 -2 64 Q-9 64 -9 71', 4.5, DETALLE.madera),
      rectangulo(112, 80, 17, 34, 6, 'cielo', 4),
      rectangulo(114, 72, 13, 10, 3, DETALLE.boina, 3.5),
      linea('M116 92 H125', 3),
      mano(6, 80, 'arena'),
      mano(112, 96, 'arena'),
    ],
  },
  trasnoche: {
    detras: [
      forma('M0 -10 A16 16 0 0 0 0 22 A22 22 0 0 1 0 -10 Z', 'sol', 3.5),
      linea('M14 56 A46 46 0 0 1 106 56', 9),
      linea('M26.5 86 Q8 92 4 104', 5),
      linea('M95.5 82 Q130 76 134 34', 5),
    ],
    delante: [
      linea('M38 54 Q46 47 54 54', 5),
      linea('M66 54 Q74 47 82 54', 5),
      forma('M44 64 Q60 84 76 64 Z', 'tinta', 4),
      forma('M53 73 Q60 68 67 73 Q60 79 53 73 Z', 'rosa-mejilla'),
      mejilla(36, 64),
      mejilla(84, 64),
      rectangulo(4, 42, 16, 28, 7, 'coral', 4),
      rectangulo(100, 42, 16, 28, 7, 'coral', 4),
      forma('M112 -22 Q112 -12 122 -12 Q112 -12 112 -2 Q112 -12 102 -12 Q112 -12 112 -22 Z', 'papel-elevado', 3.5),
      forma('M132 99 Q132 106 139 106 Q132 106 132 113 Q132 106 125 106 Q132 106 132 99 Z', 'papel-elevado', 3),
      el('rect', { x: 125, y: 42, width: 16, height: 7, rx: 3.5, fill: DETALLE.pulsera, stroke: 'tinta', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', transform: 'rotate(-8 133 45.5)' }),
      mano(134, 34, 'noche'),
    ],
  },
  morfi: {
    detras: [
      linea('M26.5 86 Q8 92 4 104', 5),
      linea('M94.5 84 Q102 94 107 100', 5),
    ],
    recortado: [
      forma('M40 92 Q60 99 80 92 L60 116 Z', 'coral', 3.5),
      el('circle', { cx: 51, cy: 99, r: 1.8, fill: 'papel-elevado' }),
      el('circle', { cx: 69, cy: 99, r: 1.8, fill: 'papel-elevado' }),
      el('circle', { cx: 60, cy: 106, r: 1.8, fill: 'papel-elevado' }),
      linea('M55 96 L48 104 M65 96 L72 104', 3.5),
      circulo(60, 96, 4.5, 'coral', 3),
    ],
    delante: [
      ojo(46, 52, 5, 7),
      ojo(74, 52, 5, 7),
      linea('M46 66 Q60 80 74 66', 5),
      forma('M64 72 Q71 70 72 75 Q72 80 67 78 Q64 77 64 72 Z', 'rosa-mejilla', 3),
      mejilla(36, 64),
      mejilla(84, 64),
      forma('M30 28 Q14 22 22 8 Q28 -4 42 2 Q48 -12 60 -8 Q72 -12 78 2 Q92 -4 98 8 Q106 22 90 28 Z', 'papel-elevado', 4),
      linea('M46 6 Q48 14 46 20 M74 6 Q72 14 74 20', 3, DETALLE.pliegue),
      forma('M28 24 Q60 18 92 24 L92 36 Q60 30 28 36 Z', 'papel-elevado', 4),
      grupo('translate(127 94) scale(1) translate(-126 -94)', [
        el('ellipse', { cx: 113, cy: 101, rx: 7, ry: 5, transform: 'rotate(40 113 101)', fill: DETALLE.croissant, stroke: 'tinta', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        el('ellipse', { cx: 139, cy: 101, rx: 7, ry: 5, transform: 'rotate(-40 139 101)', fill: DETALLE.croissant, stroke: 'tinta', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        el('ellipse', { cx: 118, cy: 93, rx: 8, ry: 10, transform: 'rotate(25 118 93)', fill: DETALLE.croissant, stroke: 'tinta', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        el('ellipse', { cx: 134, cy: 93, rx: 8, ry: 10, transform: 'rotate(-25 134 93)', fill: DETALLE.croissant, stroke: 'tinta', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        el('ellipse', { cx: 126, cy: 89, rx: 9, ry: 12, fill: DETALLE.croissant, stroke: 'tinta', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        linea('M121 84 Q126 87 131 84 M121 92 Q126 95 131 92', 2.5, DETALLE.croissantBorde),
      ]),
      circulo(138, 124, 3, DETALLE.croissant, 2.5),
      circulo(130, 131, 2.2, DETALLE.croissant, 2),
      mano(4, 104, 'mostaza'),
      mano(107, 100, 'mostaza'),
    ],
  },
  cumbre: {
    detras: [
      rectangulo(80, 44, 40, 48, 12, 'coral', 4),
      rectangulo(94, 64, 22, 18, 5, 'coral', 3.5),
      linea('M25.5 84 Q12 82 3 80', 5),
      linea('M86.0 98 Q106 108 110 114', 5),
    ],
    delante: [
      linea('M37 48 L52 52 M83 48 L68 52', 4.5),
      ojo(46, 59, 5, 5.5),
      ojo(74, 59, 5, 5.5),
      linea('M50 72 Q60 80 70 72', 5),
      circulo(60, -2, 9, 'papel-elevado', 4),
      forma('M20 38 Q20 4 60 4 Q100 4 100 38 Z', 'coral', 4),
      rectangulo(16, 30, 88, 14, 7, 'sol', 4),
      linea('M30 31 V43 M42 31 V43 M54 31 V43 M66 31 V43 M78 31 V43 M90 31 V43', 2.5, DETALLE.lana),
      linea('M4 56 L-2 130', 8),
      linea('M4 56 L-2 130', 4, 'cielo'),
      el('rect', { x: -1, y: 50, width: 10, height: 8, rx: 3, fill: 'tinta' }),
      mano(3, 80, 'bosque'),
      mano(110, 114, 'bosque'),
    ],
  },
}
