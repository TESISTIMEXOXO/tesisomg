import type { TonoPinz } from './elenco'

/*
 * Clases escritas enteras para que Tailwind las encuentre al compilar:
 * un `fill-${tono}` armado en tiempo de ejecución no se generaría.
 */
export const RELLENO_SVG: Record<TonoPinz, string> = {
  coral: 'fill-coral',
  sol: 'fill-sol',
  mar: 'fill-mar',
  lavanda: 'fill-lavanda',
  cielo: 'fill-cielo',
  durazno: 'fill-durazno',
  rosa: 'fill-rosa',
  arena: 'fill-arena',
  noche: 'fill-noche',
  mostaza: 'fill-mostaza',
  bosque: 'fill-bosque',
}

export const FONDO: Record<TonoPinz, string> = {
  coral: 'bg-coral',
  sol: 'bg-sol',
  mar: 'bg-mar',
  lavanda: 'bg-lavanda',
  cielo: 'bg-cielo',
  durazno: 'bg-durazno',
  rosa: 'bg-rosa',
  arena: 'bg-arena',
  noche: 'bg-noche',
  mostaza: 'bg-mostaza',
  bosque: 'bg-bosque',
}

export const FONDO_TINTE: Record<TonoPinz, string> = {
  coral: 'bg-coral-tinte',
  sol: 'bg-sol-tinte',
  mar: 'bg-mar-tinte',
  lavanda: 'bg-lavanda-tinte',
  cielo: 'bg-cielo-tinte',
  durazno: 'bg-durazno-tinte',
  rosa: 'bg-rosa-tinte',
  arena: 'bg-arena-tinte',
  noche: 'bg-noche-tinte',
  mostaza: 'bg-mostaza-tinte',
  bosque: 'bg-bosque-tinte',
}

/*
 * Para bloques grandes, como el encabezado del viaje. En oscuro un pastel de ese tamaño encandila
 * y su tinte se vuelve marrón: el fondo pasa a neutro y el tono queda en el contorno y la sombra.
 */
export const FONDO_DESTACADO: Record<TonoPinz, string> = {
  coral: 'bg-coral oscuro:bg-papel-elevado oscuro:border-coral oscuro:shadow-coral',
  sol: 'bg-sol oscuro:bg-papel-elevado oscuro:border-sol oscuro:shadow-sol',
  mar: 'bg-mar oscuro:bg-papel-elevado oscuro:border-mar oscuro:shadow-mar',
  lavanda: 'bg-lavanda oscuro:bg-papel-elevado oscuro:border-lavanda oscuro:shadow-lavanda',
  cielo: 'bg-cielo oscuro:bg-papel-elevado oscuro:border-cielo oscuro:shadow-cielo',
  durazno: 'bg-durazno oscuro:bg-papel-elevado oscuro:border-durazno oscuro:shadow-durazno',
  rosa: 'bg-rosa oscuro:bg-papel-elevado oscuro:border-rosa oscuro:shadow-rosa',
  arena: 'bg-arena oscuro:bg-papel-elevado oscuro:border-arena oscuro:shadow-arena',
  noche: 'bg-noche oscuro:bg-papel-elevado oscuro:border-noche oscuro:shadow-noche',
  mostaza: 'bg-mostaza oscuro:bg-papel-elevado oscuro:border-mostaza oscuro:shadow-mostaza',
  bosque: 'bg-bosque oscuro:bg-papel-elevado oscuro:border-bosque oscuro:shadow-bosque',
}
