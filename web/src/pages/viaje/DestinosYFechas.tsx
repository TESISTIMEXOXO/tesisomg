import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { CampoFecha } from '../../components/ui/CampoFecha'
import { SelectorLugar } from '../../components/ui/SelectorLugar'
import { useActualizarEtapas } from '../../hooks/viajes'
import { diaCorto } from '../../lib/fechas'
import type { EtapaViaje, LugarViaje, Viaje } from '../../types/viaje'

type EtapaBorrador = Omit<EtapaViaje, 'id' | 'ubicacion'> & { ubicacion: LugarViaje | null }

function diaSiguiente(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

function etapasIniciales(etapas: EtapaViaje[], destino: string, fechaIda: string | null, fechaVuelta: string | null, ubicacion: LugarViaje | null): EtapaBorrador[] {
  if (etapas.length) return etapas.map((etapa) => ({
    destino: etapa.destino,
    fechaIda: etapa.fechaIda,
    fechaVuelta: etapa.fechaVuelta,
    ubicacion: etapa.ubicacion,
  }))
  return [{
    destino,
    fechaIda,
    fechaVuelta,
    ubicacion,
  }]
}

function EditarEtapas({ viaje }: { viaje: Viaje }) {
  const actualizar = useActualizarEtapas(viaje.id)
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [etapas, setEtapas] = useState(() => etapasIniciales(viaje.etapas, viaje.destino, viaje.fechaIda, viaje.fechaVuelta, viaje.ubicacion))

  function cambiar(indice: number, cambios: Partial<EtapaBorrador>) {
    setEtapas((actuales) => actuales.map((etapa, i) => i === indice ? { ...etapa, ...cambios } : etapa))
  }

  function guardar(evento: FormEvent) {
    evento.preventDefault()
    setError('')
    if (etapas.some((etapa) => !etapa.ubicacion)) {
      setError('Elegí un lugar de las sugerencias para cada destino.')
      return
    }
    const completas = etapas.filter((etapa) => etapa.fechaIda && etapa.fechaVuelta)
    if (etapas.some((etapa) => Boolean(etapa.fechaIda) !== Boolean(etapa.fechaVuelta)) || (completas.length > 0 && completas.length !== etapas.length)) {
      setError('Completá las fechas de todas las etapas o dejalas pendientes.')
      return
    }
    for (let indice = 1; indice < etapas.length; indice += 1) {
      const anterior = etapas[indice - 1]
      const etapa = etapas[indice]
      if (anterior?.fechaVuelta && etapa?.fechaIda && diaSiguiente(anterior.fechaVuelta) !== etapa.fechaIda) {
        setError('Las etapas deben ser consecutivas, sin días libres ni superposiciones.')
        return
      }
    }
    actualizar.mutate(etapas.map((etapa) => ({
      destino: etapa.ubicacion!.nombre,
      fechaIda: etapa.fechaIda,
      fechaVuelta: etapa.fechaVuelta,
      ubicacion: etapa.ubicacion!,
    })), {
      onSuccess: (viajeActualizado) => {
        setEtapas(etapasIniciales(viajeActualizado.etapas, viajeActualizado.destino, viajeActualizado.fechaIda, viajeActualizado.fechaVuelta, viajeActualizado.ubicacion))
        setAbierto(false)
      },
    })
  }

  if (!abierto) {
    return (
      <Button
        variant="secundario"
        icon={Plus}
        className="self-start"
        onClick={() => {
          setEtapas(etapasIniciales(viaje.etapas, viaje.destino, viaje.fechaIda, viaje.fechaVuelta, viaje.ubicacion))
          setAbierto(true)
        }}
      >
        Editar destinos y fechas
      </Button>
    )
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4 rounded-lg trazo bg-papel-hundido p-5">
      {etapas.map((etapa, indice) => (
        <section key={indice} className="flex flex-col gap-4 border-b border-linea pb-5 last:border-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Destino {indice + 1}</h3>
            {etapas.length > 1 && (
              <Button type="button" variant="fantasma" size="sm" onClick={() => setEtapas((actuales) => actuales.filter((_, i) => i !== indice))}>
                Quitar
              </Button>
            )}
          </div>
          <SelectorLugar
            label="Destino"
            value={etapa.destino}
            hayUbicacion={Boolean(etapa.ubicacion)}
            onChange={(destino) => cambiar(indice, { destino, ubicacion: null })}
            onSelect={(ubicacion) => cambiar(indice, { destino: ubicacion.nombre, ubicacion })}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CampoFecha
              label="Ida"
              min={indice > 0 && etapas[indice - 1]?.fechaVuelta ? diaSiguiente(etapas[indice - 1].fechaVuelta!) : undefined}
              value={etapa.fechaIda ?? ''}
              onChange={(fechaIda) => cambiar(indice, { fechaIda: fechaIda || null })}
            />
            <CampoFecha
              label="Vuelta"
              min={etapa.fechaIda || undefined}
              value={etapa.fechaVuelta ?? ''}
              onChange={(fechaVuelta) => cambiar(indice, { fechaVuelta: fechaVuelta || null })}
            />
          </div>
        </section>
      ))}
      {etapas.length < 20 && (
        <Button
          type="button"
          variant="fantasma"
          icon={Plus}
          className="self-start"
          onClick={() => setEtapas((actuales) => [...actuales, { destino: '', fechaIda: null, fechaVuelta: null, ubicacion: null }])}
        >
          Agregar destino
        </Button>
      )}
      {error && <p role="alert" className="font-semibold text-negativo">{error}</p>}
      {actualizar.isError && <p role="alert" className="font-semibold text-negativo">No pudimos guardar destinos y fechas.</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={actualizar.isPending}>{actualizar.isPending ? 'Guardando…' : 'Guardar etapas'}</Button>
        <Button type="button" variant="fantasma" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

/** Los destinos del viaje en orden, con sus fechas, y el formulario para cambiarlos. Está en Agenda y en Grupo (editar viaje). */
export function DestinosYFechas({ viaje, soloLectura }: { viaje: Viaje; soloLectura: boolean }) {
  const etapas = viaje.etapas.length
    ? viaje.etapas
    : viaje.ubicacion
      ? [{ id: 'destino', destino: viaje.destino, fechaIda: viaje.fechaIda, fechaVuelta: viaje.fechaVuelta, ubicacion: viaje.ubicacion }]
      : []

  return (
    <section aria-labelledby="destinos" className="flex flex-col gap-5">
      <h3 id="destinos" className="font-display text-titulo-1 font-black">Destinos y fechas</h3>
      <ol className="flex flex-wrap gap-3">
        {etapas.map((etapaViaje, indice) => (
          <li key={etapaViaje.id} className="rounded-full trazo-fino bg-papel-hundido px-4 py-2 font-semibold">
            {indice + 1}. {etapaViaje.destino}
            {etapaViaje.fechaIda && etapaViaje.fechaVuelta && ` · ${diaCorto(etapaViaje.fechaIda)}–${diaCorto(etapaViaje.fechaVuelta)}`}
          </li>
        ))}
      </ol>
      {!soloLectura && <EditarEtapas viaje={viaje} />}
    </section>
  )
}
