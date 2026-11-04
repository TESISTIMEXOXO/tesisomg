import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NoCargo } from '../../components/marca/Estados'
import { TituloPantalla } from '../../components/marca/TituloPantalla'
import { MapaSlot } from '../../components/slots/MapaSlot'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { Chip } from '../../components/ui/Chip'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { SelectorLugar } from '../../components/ui/SelectorLugar'
import { TextField } from '../../components/ui/TextField'
import { useAhora } from '../../hooks/ahora'
import { useAgregarActividad, useExportarCalendario, useItinerario } from '../../hooks/itinerario'
import { useZonasHorarias } from '../../hooks/viajes'
import { useViajeActual } from '../../layouts/contextoViaje'
import { diaCorto, diasDeLaSemana, hoyISO, leerFecha, mesYAnio, semanasDelMes, sumarDias, sumarMeses, yaPaso } from '../../lib/fechas'
import { conMayuscula } from '../../lib/texto'
import { relojEn } from '../../lib/zonasHorarias'
import type { PuntoMapa } from '../../types/itinerario'
import type { EtapaViaje } from '../../types/viaje'
import { DestinosYFechas } from './DestinosYFechas'
import { puedeEditar } from './nombres'

function AgregarActividad({ viajeId }: { viajeId: string }) {
  const agregar = useAgregarActividad(viajeId)
  const [abierto, setAbierto] = useState(false)
  const [datos, setDatos] = useState({ fecha: '', hora: '', titulo: '', lugar: '', lat: null as number | null, lng: null as number | null })
  const [error, setError] = useState<string>()
  const [errorLugar, setErrorLugar] = useState<string>()

  function cambiar(campo: 'fecha' | 'hora' | 'titulo' | 'lugar', valor: string) {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.fecha || !datos.hora || !datos.titulo.trim()) {
      setError('Poné el día, la hora y qué van a hacer.')
      return
    }
    if (datos.lugar.trim() && (datos.lat === null || datos.lng === null)) {
      setErrorLugar('Elegí el lugar de las sugerencias para agregarlo al mapa.')
      return
    }
    setError(undefined)
    setErrorLugar(undefined)
    agregar.mutate(
      { ...datos, lugar: datos.lugar.trim() || null },
      {
        onSuccess: () => {
          setDatos({ fecha: '', hora: '', titulo: '', lugar: '', lat: null, lng: null })
          setAbierto(false)
        },
      },
    )
  }

  if (!abierto) {
    return (
      <Button variant="secundario" icon={Plus} className="self-start" onClick={() => setAbierto(true)}>
        Agregar actividad
      </Button>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFecha label="Día" value={datos.fecha} onChange={(fecha) => cambiar('fecha', fecha)} />
        <TextField label="Hora" type="time" value={datos.hora} onChange={(evento) => cambiar('hora', evento.target.value)} />
      </div>
      <TextField label="Qué van a hacer" value={datos.titulo} error={error} onChange={(evento) => cambiar('titulo', evento.target.value)} />
      <SelectorLugar
        label="Dónde (opcional)"
        value={datos.lugar}
        error={errorLugar}
        hayUbicacion={datos.lat !== null && datos.lng !== null}
        onChange={(lugar) => {
          setErrorLugar(undefined)
          setDatos((anteriores) => ({ ...anteriores, lugar, lat: null, lng: null }))
        }}
        onSelect={(lugar) => {
          setErrorLugar(undefined)
          setDatos((anteriores) => ({ ...anteriores, lugar: lugar.nombre, lat: lugar.lat, lng: lugar.lng }))
        }}
      />
      {agregar.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos guardar la actividad. Revisá la conexión y probá de nuevo.
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={agregar.isPending}>
          Agregar
        </Button>
        <Button variant="fantasma" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

/**
 * En qué destino se está ese día: el último que ya empezó. Las etapas son consecutivas, así que
 * el día que se llega al segundo destino ya cuenta con su hora. Antes del viaje, el primero; sin fechas, también.
 */
function etapaDelDia(etapas: Pick<EtapaViaje, 'fechaIda'>[], dia: string) {
  if (!etapas.length) return null
  const empezadas = etapas.flatMap((etapaViaje, indice) => (etapaViaje.fechaIda && etapaViaje.fechaIda <= dia ? [indice] : []))
  return empezadas.at(-1) ?? 0
}

type Vista = 'dia' | 'semana' | 'mes'

const VISTAS: { id: Vista; nombre: string }[] = [
  { id: 'dia', nombre: 'Día' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'mes', nombre: 'Mes' },
]

/* Lo que resalta es que haya actividades; el día en el que estás parado lleva solo un anillo. */
function CeldaDia({ fecha, cantidad, elegido, mesActual = true, onElegir }: { fecha: string; cantidad: number; elegido: boolean; mesActual?: boolean; onElegir: () => void }) {
  return (
    <button
      type="button"
      aria-label={`${diaCorto(fecha)}: ${cantidad === 1 ? '1 actividad' : `${cantidad} actividades`}`}
      aria-pressed={elegido}
      onClick={onElegir}
      className={`flex min-h-toque flex-col items-center justify-center rounded-sm trazo-fino numeros ${cantidad > 0 ? 'tema-claro bg-coral' : 'bg-papel-elevado'} ${
        elegido ? 'ring-3 ring-tinta ring-offset-2 ring-offset-papel' : ''
      } ${mesActual ? '' : 'opacity-50'}`}
    >
      <span className="font-bold">{leerFecha(fecha).getDate()}</span>
      {cantidad > 0 && <span aria-hidden className="size-1.5 rounded-full bg-tinta" />}
    </button>
  )
}

/** Agenda: el plan día por día, con vistas de semana y mes y el mapa del día elegido. */
export function Agenda() {
  const { viaje, etapa } = useViajeActual()
  const itinerario = useItinerario(viaje.id)
  const exportar = useExportarCalendario(viaje.id)
  const [vista, setVista] = useState<Vista>('dia')
  const [fechaElegida, setFechaElegida] = useState<string | null>(null)
  const soloLectura = etapa === 'post' || !puedeEditar(viaje.personas)
  const etapas = viaje.etapas.length
    ? viaje.etapas
    : viaje.ubicacion
      ? [{ id: 'destino', destino: viaje.destino, fechaIda: viaje.fechaIda, fechaVuelta: viaje.fechaVuelta, ubicacion: viaje.ubicacion }]
      : []
  const actividades = itinerario.data ?? []
  const fechas = actividades.map((actividad) => actividad.fecha).sort()
  const hoy = hoyISO()
  /* Abre en lo más próximo: hoy, o el próximo día con actividades; si ya pasaron todas, el último. */
  const primera = fechas.find((dia) => dia >= hoy) ?? fechas.at(-1) ?? viaje.fechaIda ?? hoy
  const fecha = fechaElegida ?? primera
  const ahora = useAhora()
  const zonas = useZonasHorarias(etapas.map((etapaViaje) => etapaViaje.ubicacion))
  /* Las horas se cargan en la hora del destino de ese día: con su reloj se sabe si ya pasaron. */
  const destinoDelDia = etapaDelDia(etapas, fecha)
  const zonaDelDia = destinoDelDia === null ? null : zonas[destinoDelDia]
  const relojDelDia = relojEn(zonaDelDia, ahora)
  /* Lo que viene, de lo más próximo a lo más lejano; lo que ya pasó se tilda solo y baja al final. */
  const delDia = actividades
    .filter((actividad) => actividad.fecha === fecha)
    .map((actividad) => ({ ...actividad, hecha: actividad.estado === 'hecho' || yaPaso(actividad.fecha, actividad.hora, relojDelDia) }))
    .sort((a, b) => Number(a.hecha) - Number(b.hecha) || a.hora.localeCompare(b.hora))
  const cantidad = (dia: string) => actividades.filter((actividad) => actividad.fecha === dia).length
  const centroMapa = etapas[0]?.ubicacion ?? viaje.ubicacion
  const puntosMapa: PuntoMapa[] = [
    ...etapas.map((etapaViaje) => ({
      id: etapaViaje.id,
      nombre: etapaViaje.destino,
      lat: etapaViaje.ubicacion.lat,
      lng: etapaViaje.ubicacion.lng,
      tipo: 'alojamiento' as const,
    })),
    ...delDia.flatMap((actividad) => actividad.lat !== null && actividad.lng !== null
      ? [{
          id: actividad.id,
          nombre: actividad.lugar ?? actividad.titulo,
          lat: actividad.lat,
          lng: actividad.lng,
          tipo: 'actividad' as const,
        }]
      : []),
  ]

  function mover(direccion: 1 | -1) {
    if (vista === 'dia') setFechaElegida(sumarDias(fecha, direccion))
    else if (vista === 'semana') setFechaElegida(sumarDias(fecha, direccion * 7))
    else setFechaElegida(sumarMeses(fecha, direccion))
  }

  function abrirDia(dia: string) {
    setFechaElegida(dia)
    setVista('dia')
  }

  return (
    <>
      <TituloPantalla titulo="El plan, día por día" pinz="brujula" />
      <div className="flex flex-col gap-12">
        <section aria-labelledby="itinerario" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h3 id="itinerario" className="sr-only">Actividades</h3>
            <div className="flex gap-2" role="group" aria-label="Cómo ver la agenda">
              {VISTAS.map(({ id, nombre }) => (
                <Chip key={id} tone={etapa} selected={vista === id} onClick={() => setVista(id)}>
                  {nombre}
                </Chip>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="fantasma" size="sm" icon={ChevronLeft} aria-label="Anterior" onClick={() => mover(-1)} />
              <p aria-live="polite" className="font-bold">
                {vista === 'dia' && conMayuscula(diaCorto(fecha))}
                {vista === 'semana' && `Semana del ${diaCorto(diasDeLaSemana(fecha)[0] ?? fecha)}`}
                {vista === 'mes' && mesYAnio(fecha)}
              </p>
              <Button variant="fantasma" size="sm" icon={ChevronRight} aria-label="Siguiente" onClick={() => mover(1)} />
            </div>
            {vista === 'dia' && destinoDelDia !== null && zonaDelDia && (
              <p className="-mt-3 text-center text-meta text-tinta-suave">Horarios en hora local de {etapas[destinoDelDia].destino}</p>
            )}
            {itinerario.isPending && <p className="text-tinta-suave">Cargando el itinerario…</p>}
            {itinerario.error && <NoCargo error={itinerario.error} onReintentar={() => itinerario.refetch()} />}
            {vista === 'dia' && itinerario.data && (
              delDia.length === 0 ? (
                <p className="text-tinta-suave">No hay actividades para este día.</p>
              ) : (
                <ol aria-label="El día">
                  {delDia.map((item, i) => (
                    <ItineraryItem
                      key={item.id}
                      time={item.hora}
                      title={item.titulo}
                      place={item.lugar}
                      done={item.hecha}
                      current={etapa === 'viaje' && item.estado === 'ahora' && !item.hecha}
                      last={i === delDia.length - 1}
                    />
                  ))}
                </ol>
              )
            )}
            {vista === 'semana' && (
              <div className="grid grid-cols-7 gap-1">
                {diasDeLaSemana(fecha).map((dia) => (
                  <CeldaDia key={dia} fecha={dia} cantidad={cantidad(dia)} elegido={dia === fecha} onElegir={() => abrirDia(dia)} />
                ))}
              </div>
            )}
            {vista === 'mes' && (
              <div className="grid grid-cols-7 gap-1">
                {semanasDelMes(fecha).map((dia) => (
                  <CeldaDia key={dia} fecha={dia} cantidad={cantidad(dia)} elegido={dia === fecha} mesActual={dia.slice(0, 7) === fecha.slice(0, 7)} onElegir={() => abrirDia(dia)} />
                ))}
              </div>
            )}
            {!soloLectura && <AgregarActividad viajeId={viaje.id} />}
            <Button
              variant="secundario"
              size="sm"
              icon={CalendarPlus}
              className="self-start"
              disabled={exportar.isPending || !actividades.length}
              onClick={() => exportar.mutate()}
            >
              Sincronizar con el calendario
            </Button>
          </div>
          <MapaSlot puntos={puntosMapa} personas={[]} centro={centroMapa} alto="grande" />
        </section>

        <DestinosYFechas viaje={viaje} soloLectura={soloLectura} />
      </div>
    </>
  )
}
