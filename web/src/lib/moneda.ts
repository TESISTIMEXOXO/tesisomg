const MILES = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** "$ 48.200". El signo lo pone quien lo muestra, siempre junto a la palabra. */
export function monto(valor: number) {
  return `$ ${MILES.format(Math.abs(valor))}`
}

/** "245 KB", "1,2 MB". */
export function tamanoDeArchivo(bytes: number) {
  if (bytes < 1000 * 1000) return `${Math.max(1, Math.round(bytes / 1000))} KB`
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(bytes / (1000 * 1000))} MB`
}
