import { Briefcase, Route } from 'lucide-react'
import { Cargando, NoCargo } from '../../../components/marca/Estados'
import { MapaSlot } from '../../../components/slots/MapaSlot'
import { ButtonLink } from '../../../components/ui/Button'
import { ItineraryItem } from '../../../components/ui/ItineraryItem'
import { useHoy } from '../../../hooks/itinerario'
import { useViajeActual } from '../../../layouts/contextoViaje'
import { diaCorto } from '../../../lib/fechas'

/** Viaje: ¿qué hacemos hoy y dónde nos encontramos? El botón de gasto flota en el layout. */
export function Hoy() {
  const { viaje } = useViajeActual()
  const { data: hoy, isPending, error, refetch } = useHoy(viaje.id)

  if (isPending) return <Cargando pinz="siesta" />
  if (error) return <NoCargo error={error} onReintentar={() => refetch()} />

  const enElLugar = hoy.ubicaciones.length

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-7">
      <div className="flex flex-col gap-4">
        <span className="self-start rounded-full trazo-fino bg-papel-elevado px-3 py-1 text-sobretitulo uppercase">
          Día {hoy.dia} de {hoy.totalDias} · {diaCorto(hoy.fecha)}
        </span>
        <h2 className="font-display text-display font-black">Hoy, {hoy.titulo}.</h2>
        {hoy.aviso && (
          <p role="status" className="rounded-lg trazo bg-sol-tinte px-4 py-3 font-semibold">
            {hoy.aviso}
          </p>
        )}
        <MapaSlot puntos={hoy.puntos} personas={hoy.ubicaciones} />
        {enElLugar > 0 && (
          <p className="text-meta text-tinta-suave">
            {enElLugar} de {viaje.personas.length} compartiendo su ubicación
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <ol aria-label="El día">
          {hoy.items.map((item, i) => (
            <ItineraryItem
              key={item.id}
              time={item.hora}
              title={item.titulo}
              place={item.lugar}
              done={item.estado === 'hecho'}
              current={item.estado === 'ahora'}
              last={i === hoy.items.length - 1}
            />
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink to={`/viajes/${viaje.id}/plan`} variant="secundario" size="sm" icon={Route}>
            Ruta
          </ButtonLink>
          <ButtonLink to={`/viajes/${viaje.id}/baul`} variant="secundario" size="sm" icon={Briefcase}>
            Voucher
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
