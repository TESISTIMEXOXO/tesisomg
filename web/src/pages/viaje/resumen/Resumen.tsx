import { useViajeActual } from '../../../layouts/contextoViaje'
import { Hoy } from './Hoy'
import { ResumenPostViaje } from './ResumenPostViaje'
import { ResumenPrevaje } from './ResumenPrevaje'

/** Resumen cambia según la etapa que se esté mirando: cada una responde su pregunta. */
export function Resumen() {
  const { etapa } = useViajeActual()
  if (etapa === 'viaje') return <Hoy />
  if (etapa === 'post') return <ResumenPostViaje />
  return <ResumenPrevaje />
}
