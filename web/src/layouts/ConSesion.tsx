import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PinzNote } from '../components/marca/PinzNote'
import { useSesion } from '../hooks/auth'
import { usePerfil } from '../hooks/perfil'
import { elegirTema } from '../lib/tema'

function TemaDeLaCuenta() {
  const { data: perfil } = usePerfil()
  useEffect(() => {
    if (perfil) elegirTema(perfil.tema)
  }, [perfil])
  return null
}

/** Las pantallas de la cuenta: sin sesión se va a ingresar; sin perfil completo, a la bienvenida. */
export function ConSesion() {
  const { data: sesion, isPending, isError, refetch } = useSesion()
  const { pathname } = useLocation()

  if (isPending) return <div aria-busy="true" className="min-h-dvh" />
  if (isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-120 flex-col justify-center px-4">
        <PinzNote tipo="error" title="No pudimos conectarnos" action="Probar de nuevo" onAction={() => refetch()}>
          Revisá la conexión y volvé a intentar.
        </PinzNote>
      </main>
    )
  }
  if (!sesion) return <Navigate to="/ingresar" replace />
  if (!sesion.perfilCompleto && pathname !== '/bienvenida') return <Navigate to="/bienvenida" replace />
  return (
    <>
      <TemaDeLaCuenta />
      <Outlet />
    </>
  )
}
