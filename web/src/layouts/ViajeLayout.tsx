import { Briefcase, CalendarDays, House, ListChecks, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useMatch, useParams } from 'react-router-dom'
import { Cargando, NoCargo } from '../components/marca/Estados'
import { CompartirUbicacion } from '../components/slots/CompartirUbicacion'
import { BottomNav, type ItemNav } from '../components/ui/BottomNav'
import { ButtonLink } from '../components/ui/Button'
import { useViaje } from '../hooks/viajes'
import { etapaDelViaje } from '../lib/etapa'
import type { Etapa } from '../types/viaje'
import type { ContextoViaje } from './contextoViaje'
import { BarraSuperior } from './BarraSuperior'
import { EncabezadoViaje } from './EncabezadoViaje'

function secciones(id: string): ItemNav[] {
  return [
    { id: 'inicio', label: 'Inicio', icon: House, to: `/viajes/${id}`, end: true },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays, to: `/viajes/${id}/agenda` },
    { id: 'listas', label: 'Listas', icon: ListChecks, to: `/viajes/${id}/listas` },
    { id: 'cuentas', label: 'Cuentas', icon: Wallet, to: `/viajes/${id}/cuentas` },
    { id: 'baul', label: 'Baúl', icon: Briefcase, to: `/viajes/${id}/baul` },
  ]
}

/** Adentro de un viaje: encabezado con la etapa, las cinco secciones y la alarma fijas y, en Viaje, el gasto a mano. */
export function ViajeLayout() {
  const { id = '' } = useParams()
  const { data: viaje, isPending, error, refetch } = useViaje(id)
  const enEmergencias = useMatch('/viajes/:id/emergencias') !== null
  const [etapaElegida, setEtapaElegida] = useState<{ viajeId: string; etapa: Etapa } | null>(null)

  const items = secciones(id)

  let contenido
  // Emergencias nunca lleva pinz, ni siquiera mientras carga.
  if (isPending) contenido = enEmergencias ? <p role="status">Cargando el viaje…</p> : <Cargando />
  else if (error) {
    contenido = enEmergencias ? (
      <p role="alert" className="font-bold">No pudimos cargar el viaje. Si es urgente, llamá al 112 (en Argentina, al 911).</p>
    ) : (
      <NoCargo error={error} onReintentar={() => refetch()} />
    )
  } else {
    // La etapa sale de las fechas. El selector para mirar otra etapa existe solo en desarrollo.
    const etapa = import.meta.env.DEV && etapaElegida?.viajeId === viaje.id ? etapaElegida.etapa : etapaDelViaje(viaje)
    const contexto: ContextoViaje = { viaje, etapa }
    contenido = (
      <>
        <EncabezadoViaje viaje={viaje} etapa={etapa} onCambiarEtapa={(nueva) => setEtapaElegida({ viajeId: viaje.id, etapa: nueva })} />
        {etapa === 'viaje' && <CompartirUbicacion key={viaje.id} viajeId={viaje.id} />}
        <div className="pt-8 lg:pt-12">
          <Outlet context={contexto} />
        </div>
        {etapa === 'viaje' && (
          <ButtonLink
            to={`/viajes/${viaje.id}/cuentas#nuevo-gasto`}
            icon={Plus}
            className="fixed right-4 bottom-27 z-20 lg:right-10"
          >
            Agregar gasto
          </ButtonLink>
        )}
      </>
    )
  }

  return (
    <>
      {!enEmergencias && <BarraSuperior />}
      <main className="mx-auto max-w-contenido px-4 pt-4 pb-29 md:px-6 lg:px-10 lg:pt-8">{contenido}</main>
      <BottomNav items={items} sosTo={`/viajes/${id}/emergencias`} />
    </>
  )
}
