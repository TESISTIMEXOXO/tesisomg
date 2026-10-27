import { useOutletContext } from 'react-router-dom'
import type { Etapa, Viaje } from '../types/viaje'

export type ContextoViaje = {
  viaje: Viaje
  /** La que dicen las fechas, o en desarrollo la que se eligió en el StageSwitch. */
  etapa: Etapa
}

/** El viaje y la etapa que carga ViajeLayout, para las pantallas de adentro del viaje. */
export function useViajeActual() {
  return useOutletContext<ContextoViaje>()
}
