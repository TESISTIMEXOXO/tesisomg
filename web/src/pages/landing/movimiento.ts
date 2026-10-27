import type { CSSProperties } from 'react'

/**
 * Inclinación y desfase de un pinz animado. La inclinación va por --r: los keyframes
 * de rebote y salto la usan, y sin movimiento queda aplicada por el transform.
 */
export function inclinado(grados: number, demora = 0): CSSProperties {
  return { '--r': `${grados}deg`, transform: 'rotate(var(--r))', animationDelay: `${demora}s` } as CSSProperties
}
