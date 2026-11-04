import { useEffect, useState } from 'react'

/** La hora actual, renovada cada minuto: para lo que cambia solo con el paso del tiempo, como una actividad que ya pasó. */
export function useAhora() {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(reloj)
  }, [])
  return ahora
}
