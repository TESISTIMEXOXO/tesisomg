import { Briefcase, Route } from 'lucide-react'
import { Cargando, NoCargo } from '../../../components/marca/Estados'
import { TituloPantalla } from '../../../components/marca/TituloPantalla'
import { MapaSlot } from '../../../components/slots/MapaSlot'
import { ButtonLink } from '../../../components/ui/Button'
import { ItineraryItem } from '../../../components/ui/ItineraryItem'
import { useHoy } from '../../../hooks/itinerario'
import { useUbicaciones } from '../../../hooks/ubicaciones'
import { useViajeActual } from '../../../layouts/contextoViaje'
import { diaCorto } from '../../../lib/fechas'
import { numerarParadas } from '../../../lib/paradas'

/** Viaje: ¿qué hacemos hoy y dónde nos encontramos? El botón de gasto flota en el layout. */
export function Hoy() {
  const { viaje } = useViajeActual()
  const { data: hoy, isPending, error, refetch } = useHoy(viaje.id)
  const ubicaciones = useUbicaciones(viaje.id)

  if (isPending) return <Cargando pinz="siesta" />
  if (error) return <NoCargo error={error} onReintentar={() => refetch()} />

  const personasUbicadas = ubicaciones.data ?? []
  const enElLugar = personasUbicadas.length
  const etapaDeHoy = viaje.etapas.find((etapa) => etapa.fechaIda && etapa.fechaVuelta && etapa.fechaIda <= hoy.fecha && etapa.fechaVuelta >= hoy.fecha)
  const centroMapa = etapaDeHoy?.ubicacion ?? viaje.ubicacion
  // El backend marca "ahora" a todo lo de hoy que ya empezó. La que va es la última que arrancó; las anteriores ya pasaron.
  const idActual = hoy.items.findLast((item) => item.estado === 'ahora')?.id
  const actividades = hoy.items.map((item) => ({ ...item, hecha: item.estado === 'hecho' || (item.estado === 'ahora' && item.id !== idActual) }))
  // Como en la Agenda: arriba lo que viene, de lo más próximo a lo más lejano, y lo que ya pasó baja al final.
  const pendientes = actividades.filter((item) => !item.hecha)
  const delDia = [...pendientes, ...actividades.filter((item) => item.hecha)]

  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-4 lg:grid-cols-2">
      {/* El encabezado ocupa las dos columnas en desktop: así el mapa y el itinerario arrancan a la misma altura. */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <span className="self-start rounded-full trazo-fino bg-papel-elevado px-3 py-1 text-sobretitulo uppercase">
          Día {hoy.dia} de {hoy.totalDias} · {diaCorto(hoy.fecha)}
        </span>
        <TituloPantalla titulo={`Hoy, ${hoy.titulo}.`} pinz="siesta" />
        {hoy.aviso && (
          <p role="status" className="rounded-lg trazo bg-sol-tinte px-4 py-3 font-semibold">
            {hoy.aviso}
          </p>
        )}
        {ubicaciones.error && <p role="alert" className="text-meta text-negativo">No pudimos actualizar las ubicaciones compartidas.</p>}
        {enElLugar > 0 && (
          <p className="text-meta text-tinta-suave">
            {enElLugar} de {viaje.personas.length} compartiendo su ubicación
          </p>
        )}
      </div>
      {/* En desktop el mapa crece hasta el alto del itinerario y los botones bajan hasta su borde de abajo. */}
      <MapaSlot puntos={numerarParadas(hoy.puntos, pendientes)} personas={personasUbicadas} centro={centroMapa} className="lg:h-auto lg:min-h-90" />
      <div className="mt-4 flex flex-col gap-4 lg:mt-0 lg:justify-between">
        <ol aria-label="El día">
          {delDia.map((item, i) => (
            <ItineraryItem
              key={item.id}
              time={item.hora}
              title={item.titulo}
              place={item.lugar}
              ubicacion={item.lat !== null && item.lng !== null ? { lat: item.lat, lng: item.lng } : null}
              done={item.hecha}
              current={item.id === idActual}
              last={i === delDia.length - 1}
            />
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink to={`/viajes/${viaje.id}/agenda`} variant="secundario" size="sm" icon={Route}>
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
