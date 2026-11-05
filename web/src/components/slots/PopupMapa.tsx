import type { ReactNode } from 'react'
import { Popup } from 'react-leaflet'

/*
 * Leaflet le pone su propia fuente al mapa: acá vuelve la de la app.
 * El globo es siempre blanco, así que el texto va en la paleta clara aunque la app esté en oscuro.
 */
export function PopupMapa({ children }: { children: ReactNode }) {
  return (
    <Popup>
      <span className="tema-claro font-texto text-etiqueta">{children}</span>
    </Popup>
  )
}
