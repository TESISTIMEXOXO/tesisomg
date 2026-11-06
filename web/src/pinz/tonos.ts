import { ELENCO, type PinzId, type TonoPinz } from './elenco'

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
 * Para bloques grandes, como el encabezado del viaje. El color es el mismo en los dos temas:
 * sobre el negro contrasta, y tema-claro deja su texto oscuro.
 */
export const FONDO_DESTACADO: Record<TonoPinz, string> = {
  coral: 'tema-claro bg-coral',
  sol: 'tema-claro bg-sol',
  mar: 'tema-claro bg-mar',
  lavanda: 'tema-claro bg-lavanda',
  cielo: 'tema-claro bg-cielo',
  durazno: 'tema-claro bg-durazno',
  rosa: 'tema-claro bg-rosa',
  arena: 'tema-claro bg-arena',
  noche: 'tema-claro bg-noche',
  mostaza: 'tema-claro bg-mostaza',
  bosque: 'tema-claro bg-bosque',
}

/* Sin pinz elegido, los tonos rotan y no significan nada. */
const TONOS_SIN_PINZ: TonoPinz[] = ['sol', 'mar', 'lavanda', 'coral']

/** El tono de cada persona: el de su pinz o, sin pinz, uno que rota según su lugar en la lista. */
export function tonoDePersona(pinz: PinzId | null | undefined, indice: number) {
  return pinz ? ELENCO[pinz].tono : TONOS_SIN_PINZ[indice % TONOS_SIN_PINZ.length]
}
