import { CalendarDays, Clock, MapPin, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendario } from '../../components/calendario/Calendario'
import type { ActividadCalendario, TramoCalendario, VistaCalendario } from '../../components/calendario/tipos'
import { ORDEN_TONOS, tramoDelDia } from '../../components/calendario/utilidades'
import { NoCargo } from '../../components/marca/Estados'
import { TituloPantalla } from '../../components/marca/TituloPantalla'
import { MapaSlot } from '../../components/slots/MapaSlot'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { SelectorLugar } from '../../components/ui/SelectorLugar'
import { TextField } from '../../components/ui/TextField'
import { Ventana } from '../../components/ui/Ventana'
import { useAhora } from '../../hooks/ahora'
import { useAgregarActividad, useEnlaceCalendario, useExportarCalendario, useItinerario } from '../../hooks/itinerario'
import { useZonasHorarias } from '../../hooks/viajes'
import { useViajeActual } from '../../layouts/contextoViaje'
import { diaCorto, hoyISO, leerFecha, yaPaso } from '../../lib/fechas'
import { relojEn } from '../../lib/zonasHorarias'
import type { PuntoMapa } from '../../types/itinerario'
import type { EtapaViaje } from '../../types/viaje'
import { DestinosYFechas } from './DestinosYFechas'
import { puedeEditar } from './nombres'

type ValoresIniciales = { fecha: string; hora: string }

type AgregarActividadProps = {
  viajeId: string
  /** Con valores (tocar un horario vacío del calendario), el formulario abre con el día y la hora cargados. */
  iniciales: ValoresIniciales | null
  abierto: boolean
  onAbrir: () => void
  onCerrar: () => void
}

const VACIO = { fecha: '', hora: '', horaFin: '', titulo: '', lugar: '', lat: null as number | null, lng: null as number | null }

function AgregarActividad({ viajeId, iniciales, abierto, onAbrir, onCerrar }: AgregarActividadProps) {
  const agregar = useAgregarActividad(viajeId)
  const [datos, setDatos] = useState(() => ({ ...VACIO, ...iniciales }))
  const [error, setError] = useState<string>()
  const [errorHoraFin, setErrorHoraFin] = useState<string>()
  const [errorLugar, setErrorLugar] = useState<string>()
  const formulario = useRef<HTMLFormElement>(null)

  /* Al abrirse se lleva el foco (y la pantalla): al primer campo vacío, que con día y hora cargados es "Qué van a hacer". */
  useEffect(() => {
    if (!abierto) return
    const campo = formulario.current?.querySelector<HTMLInputElement>(iniciales ? '[data-campo="titulo"]' : 'input')
    campo?.focus()
    formulario.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [abierto, iniciales])

  function cambiar(campo: 'fecha' | 'hora' | 'horaFin' | 'titulo' | 'lugar', valor: string) {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.fecha || !datos.hora || !datos.titulo.trim()) {
      setError('Poné el día, la hora y qué van a hacer.')
      return
    }
    setError(undefined)
    if (datos.horaFin && datos.horaFin <= datos.hora) {
      setErrorHoraFin('Tiene que terminar después de la hora de inicio.')
      return
    }
    setErrorHoraFin(undefined)
    if (datos.lugar.trim() && (datos.lat === null || datos.lng === null)) {
      setErrorLugar('Elegí el lugar de las sugerencias para agregarlo al mapa.')
      return
    }
    setErrorLugar(undefined)
    agregar.mutate(
      { ...datos, horaFin: datos.horaFin || null, lugar: datos.lugar.trim() || null },
      {
        onSuccess: () => {
          setDatos(VACIO)
          onCerrar()
        },
      },
    )
  }

  if (!abierto) {
    return (
      <Button variant="secundario" icon={Plus} className="self-start" onClick={onAbrir}>
        Agregar actividad
      </Button>
    )
  }

  return (
    <form ref={formulario} onSubmit={enviar} noValidate className="flex scroll-mt-6 flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CampoFecha label="Día" value={datos.fecha} onChange={(fecha) => cambiar('fecha', fecha)} />
        <TextField label="Hora" type="time" value={datos.hora} onChange={(evento) => cambiar('hora', evento.target.value)} />
        <TextField
          label="Hasta (opcional)"
          type="time"
          value={datos.horaFin}
          error={errorHoraFin}
          onChange={(evento) => {
            setErrorHoraFin(undefined)
            cambiar('horaFin', evento.target.value)
          }}
        />
      </div>
      <TextField
        label="Qué van a hacer"
        data-campo="titulo"
        value={datos.titulo}
        error={error}
        onChange={(evento) => cambiar('titulo', evento.target.value)}
      />
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
        <Button variant="fantasma" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

/** Lo que se ve al tocar una actividad del calendario, con el atajo a su día. */
function DetalleActividad({ actividad, onCerrar, onVerDia }: { actividad: ActividadCalendario | null; onCerrar: () => void; onVerDia: (fecha: string) => void }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (actividad && !ventana.current?.open) ventana.current?.showModal()
  }, [actividad])

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={onCerrar}>
      {actividad && (
        <div className="flex flex-col gap-5 pr-10">
          <h2 id={idTitulo} className="font-display text-titulo-1 font-black text-balance">
            {actividad.titulo}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 font-bold numeros">
              <Clock size={20} strokeWidth={2} aria-hidden />
              {diaCorto(actividad.fecha)}, {actividad.hora}
              {actividad.horaFin && ` – ${actividad.horaFin}`}
            </p>
            {actividad.lugar && (
              <p className="flex items-center gap-2">
                <MapPin size={20} strokeWidth={2} aria-hidden />
                {actividad.lugar}
              </p>
            )}
          </div>
          <Button
            variant="secundario"
            icon={CalendarDays}
            className="self-start"
            onClick={() => {
              onVerDia(actividad.fecha)
              ventana.current?.close()
            }}
          >
            Ver el día
          </Button>
        </div>
      )}
    </Ventana>
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

const VISTAS: VistaCalendario[] = ['dia', 'semana', 'mes']

function esVista(valor: string | null): valor is VistaCalendario {
  return VISTAS.includes(valor as VistaCalendario)
}

/** AAAA-MM-DD de verdad: "2026-02-31" no pasa. */
function esFecha(valor: string | null): valor is string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const d = leerFecha(valor)
  return !Number.isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === valor
}

/** Agenda: el plan del grupo como calendario de día, semana y mes, con el mapa del día elegido. */
export function Agenda() {
  const { viaje, etapa } = useViajeActual()
  const itinerario = useItinerario(viaje.id)
  const descargar = useExportarCalendario(viaje.id)
  const enlace = useEnlaceCalendario(viaje.id)
  const [parametros, setParametros] = useSearchParams()
  const [formulario, setFormulario] = useState<{ abierto: boolean; iniciales: ValoresIniciales | null; vez: number }>({ abierto: false, iniciales: null, vez: 0 })
  const [abierta, setAbierta] = useState<ActividadCalendario | null>(null)
  const soloLectura = etapa === 'post' || !puedeEditar(viaje.personas)
  const etapas = viaje.etapas.length
    ? viaje.etapas
    : viaje.ubicacion
      ? [{ id: 'destino', destino: viaje.destino, fechaIda: viaje.fechaIda, fechaVuelta: viaje.fechaVuelta, ubicacion: viaje.ubicacion }]
      : []
  const datos = itinerario.data ?? []
  const fechas = datos.map((actividad) => actividad.fecha).sort()
  const hoy = hoyISO()
  /* Abre en lo más próximo: hoy, o el próximo día con actividades; si ya pasaron todas, el último. */
  const primera = fechas.find((dia) => dia >= hoy) ?? fechas.at(-1) ?? viaje.fechaIda ?? hoy
  const vistaEnUrl = parametros.get('vista')
  const fechaEnUrl = parametros.get('fecha')
  const vista: VistaCalendario = esVista(vistaEnUrl) ? vistaEnUrl : 'semana'
  const fecha = esFecha(fechaEnUrl) ? fechaEnUrl : primera

  const ahora = useAhora()
  const zonas = useZonasHorarias(etapas.map((etapaViaje) => etapaViaje.ubicacion))
  /* Las horas se cargan en la hora del destino de ese día: con su reloj se sabe si ya pasaron. */
  const relojDe = (dia: string) => {
    const indice = etapaDelDia(etapas, dia)
    return relojEn(indice === null ? null : (zonas[indice] ?? null), ahora)
  }
  const destinoDelDia = etapaDelDia(etapas, fecha)
  const zonaDelDia = destinoDelDia === null ? null : (zonas[destinoDelDia] ?? null)

  const tramos: TramoCalendario[] = etapas
    .filter((etapaViaje) => etapaViaje.fechaIda && etapaViaje.fechaVuelta)
    .map((etapaViaje, i) => ({
      id: etapaViaje.id,
      destino: etapaViaje.destino,
      desde: etapaViaje.fechaIda!,
      hasta: etapaViaje.fechaVuelta!,
      tono: ORDEN_TONOS[i % ORDEN_TONOS.length]!,
    }))

  /* El backend marca "ahora" a todo lo de hoy que ya empezó: en el calendario va una sola, la última que empezó. */
  const enCurso = etapa === 'viaje'
    ? datos.filter((actividad) => actividad.estado === 'ahora').sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`)).at(-1)?.id
    : undefined

  const actividades: ActividadCalendario[] = datos.map((actividad) => ({
    id: actividad.id,
    fecha: actividad.fecha,
    hora: actividad.hora,
    horaFin: actividad.horaFin,
    titulo: actividad.titulo,
    lugar: actividad.lugar,
    hecha: actividad.estado === 'hecho' || yaPaso(actividad.fecha, actividad.hora, relojDe(actividad.fecha)),
    ahora: actividad.id === enCurso,
    tono: tramoDelDia(tramos, actividad.fecha)?.tono ?? 'lavanda',
  }))

  const centroMapa = etapas[0]?.ubicacion ?? viaje.ubicacion
  const puntosMapa: PuntoMapa[] = [
    ...etapas.map((etapaViaje) => ({
      id: etapaViaje.id,
      nombre: etapaViaje.destino,
      lat: etapaViaje.ubicacion.lat,
      lng: etapaViaje.ubicacion.lng,
      tipo: 'alojamiento' as const,
    })),
    ...datos
      .filter((actividad) => actividad.fecha === fecha)
      .flatMap((actividad) => actividad.lat !== null && actividad.lng !== null
        ? [{
            id: actividad.id,
            nombre: actividad.lugar ?? actividad.titulo,
            lat: actividad.lat,
            lng: actividad.lng,
            tipo: 'actividad' as const,
          }]
        : []),
  ]

  /*
   * Vista y fecha viven en la URL: se pueden compartir y sobreviven a recargar. replace: las flechas no llenan el historial.
   * Elegir un día cambia la fecha y la vista en el mismo click: los dos cambios se juntan y se escriben una sola vez.
   * Con dos setParametros seguidos, el segundo parte de la URL vieja y pisa la fecha del primero.
   */
  const pendientes = useRef<URLSearchParams | null>(null)

  function cambiar(campo: 'vista' | 'fecha', valor: string) {
    const nuevos = pendientes.current ?? new URLSearchParams(parametros)
    nuevos.set(campo, valor)
    if (!nuevos.has('fecha')) nuevos.set('fecha', fecha)
    if (pendientes.current) return
    pendientes.current = nuevos
    queueMicrotask(() => {
      pendientes.current = null
      setParametros(nuevos, { replace: true })
    })
  }

  function verDia(dia: string) {
    cambiar('fecha', dia)
    cambiar('vista', 'dia')
  }

  function abrirFormulario(iniciales: ValoresIniciales | null) {
    // "vez" remonta el formulario: así toma los valores nuevos aunque ya estuviera abierto.
    setFormulario((anterior) => ({ abierto: true, iniciales, vez: anterior.vez + 1 }))
  }

  /*
   * El link de suscripción se pide una vez y queda guardado. La pestaña de Google se abre antes de pedirlo,
   * en el mismo click: si se abriera después de esperar al backend, el navegador la bloquearía.
   */
  async function conEnlace(usar: (url: string) => void, pestana?: Window | null) {
    try {
      usar(enlace.data ?? (await enlace.mutateAsync()))
    } catch {
      pestana?.close()
    }
  }

  const webcal = (url: string) => url.replace(/^https?:\/\//, 'webcal://')

  const exportar = {
    onGoogle: () => {
      const pestana = window.open('', '_blank')
      if (pestana) pestana.opener = null
      void conEnlace((url) => {
        const destino = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal(url))}`
        if (pestana) pestana.location.href = destino
        else window.open(destino, '_blank', 'noopener')
      }, pestana)
    },
    onIphone: () => void conEnlace((url) => window.location.assign(webcal(url))),
    onDescargar: () => descargar.mutate(),
    cargando: enlace.isPending || descargar.isPending,
  }

  return (
    <>
      <TituloPantalla titulo="El plan, día por día" pinz="brujula" />
      <div className="flex flex-col gap-12">
        <section aria-labelledby="itinerario" className="flex flex-col gap-5">
          <h3 id="itinerario" className="sr-only">Actividades</h3>
          {itinerario.error && <NoCargo error={itinerario.error} onReintentar={() => itinerario.refetch()} />}
          <Calendario
            vista={vista}
            fecha={fecha}
            hoy={hoy}
            ahora={relojEn(zonaDelDia, ahora)}
            actividades={actividades}
            tramos={tramos}
            onCambiarVista={(nueva) => cambiar('vista', nueva)}
            onCambiarFecha={(nueva) => cambiar('fecha', nueva)}
            onAbrirActividad={setAbierta}
            onCrear={soloLectura ? undefined : (dia, hora) => abrirFormulario({ fecha: dia, hora })}
            exportar={exportar}
            lateral={<MapaSlot puntos={puntosMapa} personas={[]} centro={centroMapa} alto="grande" />}
          />
          {(enlace.isError || descargar.isError) && (
            <p role="alert" className="font-semibold text-negativo">
              No pudimos armar tu calendario. Revisá la conexión y probá de nuevo.
            </p>
          )}
          {vista === 'dia' && destinoDelDia !== null && zonaDelDia && (
            <p className="text-meta text-tinta-suave">Horarios en hora local de {etapas[destinoDelDia]?.destino}</p>
          )}
          {!soloLectura && (
            <AgregarActividad
              key={formulario.vez}
              viajeId={viaje.id}
              iniciales={formulario.iniciales}
              abierto={formulario.abierto}
              onAbrir={() => abrirFormulario(null)}
              onCerrar={() => setFormulario((anterior) => ({ ...anterior, abierto: false, iniciales: null }))}
            />
          )}
        </section>

        <DestinosYFechas viaje={viaje} soloLectura={soloLectura} />
      </div>
      <DetalleActividad actividad={abierta} onCerrar={() => setAbierta(null)} onVerDia={verDia} />
    </>
  )
}
