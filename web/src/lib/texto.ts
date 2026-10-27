/** "Santi", "vos y Santi", "Santi, Pedro y Tomi". */
export function enumerar(nombres: string[]) {
  if (nombres.length <= 1) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

export function conMayuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
