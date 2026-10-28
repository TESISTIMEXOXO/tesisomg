import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ConSesion } from './layouts/ConSesion'
import { PublicLayout } from './layouts/PublicLayout'
import { ViajeLayout } from './layouts/ViajeLayout'
import { NoEncontrada } from './pages/NoEncontrada'

/* Cada pantalla se baja recién cuando se visita: la landing no carga la app y viceversa. */
export const router = createBrowserRouter([
  {
    path: '/',
    hydrateFallbackElement: <div aria-busy="true" className="min-h-dvh" />,
    children: [
      { index: true, lazy: () => import('./pages/landing/Landing').then((m) => ({ Component: m.Landing })) },
      {
        element: <PublicLayout />,
        children: [
          { path: 'ingresar', lazy: () => import('./pages/ingresar/Ingresar').then((m) => ({ Component: m.Ingresar })) },
          { path: 'unirse', lazy: () => import('./pages/unirse/Unirse').then((m) => ({ Component: m.Unirse })) },
          { path: 'unirse/:codigo', lazy: () => import('./pages/unirse/VistaInvitacion').then((m) => ({ Component: m.VistaInvitacion })) },
        ],
      },
      {
        element: <ConSesion />,
        children: [
          {
            element: <PublicLayout />,
            children: [
              { path: 'bienvenida', lazy: () => import('./pages/bienvenida/Bienvenida').then((m) => ({ Component: m.Bienvenida })) },
            ],
          },
          {
            element: <AppLayout />,
            children: [
              { path: 'viajes', lazy: () => import('./pages/viajes/MisViajes').then((m) => ({ Component: m.MisViajes })) },
              { path: 'viajes/nuevo', lazy: () => import('./pages/viajes/NuevoViaje').then((m) => ({ Component: m.NuevoViaje })) },
              { path: 'vos', lazy: () => import('./pages/vos/Vos').then((m) => ({ Component: m.Vos })) },
            ],
          },
          {
            path: 'viajes/:id',
            element: <ViajeLayout />,
            children: [
              { index: true, lazy: () => import('./pages/viaje/resumen/Resumen').then((m) => ({ Component: m.Resumen })) },
              { path: 'plan', lazy: () => import('./pages/viaje/Plan').then((m) => ({ Component: m.Plan })) },
              { path: 'cuentas', lazy: () => import('./pages/viaje/Cuentas').then((m) => ({ Component: m.Cuentas })) },
              { path: 'baul', lazy: () => import('./pages/viaje/Baul').then((m) => ({ Component: m.Baul })) },
              { path: 'grupo', lazy: () => import('./pages/viaje/Grupo').then((m) => ({ Component: m.Grupo })) },
              { path: 'emergencias', lazy: () => import('./pages/viaje/Emergencias').then((m) => ({ Component: m.Emergencias })) },
            ],
          },
        ],
      },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
])
