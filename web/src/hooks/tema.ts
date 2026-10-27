import { useEffect, useSyncExternalStore } from 'react'
import { elegirTema, forzarClaro, preferenciaTema, suscribirseAlTema } from '../lib/tema'

export function useTema() {
  const preferencia = useSyncExternalStore(suscribirseAlTema, preferenciaTema)
  return { preferencia, elegir: elegirTema }
}

export function useSoloClaro() {
  useEffect(() => {
    forzarClaro(true)
    return () => forzarClaro(false)
  }, [])
}
