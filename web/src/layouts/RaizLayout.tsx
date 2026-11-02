import { Outlet } from 'react-router-dom'
import { AvisoCookies } from '../components/ui/AvisoCookies'

/** Lo que acompaña a todas las pantallas del sitio. */
export function RaizLayout() {
  return (
    <>
      <Outlet />
      <AvisoCookies />
    </>
  )
}
