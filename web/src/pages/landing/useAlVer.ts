import { useEffect, useRef, useState } from 'react'

/**
 * Avisa cuando el elemento entra en pantalla (una sola vez), para arrancar animaciones de scroll.
 * Sin IntersectionObserver todo se muestra de entrada.
 */
export function useAlVer<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const elemento = ref.current
    if (!elemento || visible) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [visible])

  return { ref, visible }
}
