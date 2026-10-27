import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, NoCargo } from '../../../components/marca/Estados'
import { PinzNote } from '../../../components/marca/PinzNote'
import { BalanceRow } from '../../../components/ui/BalanceRow'
import { Tarjeta } from '../../../components/ui/Tarjeta'
import { useTareas } from '../../../hooks/baul'
import { useSaldos } from '../../../hooks/gastos'
import { useResumenViaje } from '../../../hooks/viajes'
import { useVotaciones } from '../../../hooks/votaciones'
import { useViajeActual } from '../../../layouts/contextoViaje'
import { direccionDe } from '../../../lib/saldo'
import { conMayuscula } from '../../../lib/texto'
import { IrAAgregarGasto } from '../IrAAgregarGasto'
import { nombreEnElGrupo, puedeEditar } from '../nombres'
import { TarjetaVotacion } from '../TarjetaVotacion'

/** Previaje: ¿qué falta decidir y quién lo resuelve? */
export function ResumenPrevaje() {
  const { viaje } = useViajeActual()
  const resumen = useResumenViaje(viaje.id)
  const votaciones = useVotaciones(viaje.id)
  const tareas = useTareas(viaje.id)
  const saldos = useSaldos(viaje.id)
  const [tipCerrado, setTipCerrado] = useState(false)

  if (resumen.isPending || votaciones.isPending) return <Cargando pinz="chispa" />
  if (resumen.error) return <NoCargo error={resumen.error} onReintentar={() => resumen.refetch()} />
  if (votaciones.error) return <NoCargo error={votaciones.error} onReintentar={() => votaciones.refetch()} />

  const abiertas = votaciones.data.filter((v) => v.estado === 'abierta')
  const principal = abiertas.find((v) => v.votoPropio === null) ?? abiertas[0]
  const { hechas, total } = resumen.data.checklist
  const proximas = (tareas.data ?? []).filter((t) => t.lista === 'compartida' && !t.hecha).slice(0, 3)
  const pendienteDePlata = saldos.data?.saldos.find((s) => direccionDe(s.monto) === 'pendiente')

  return (
    <div className="grid gap-8 lg:grid-cols-3 lg:gap-7">
      <div className="flex flex-col gap-8 lg:col-span-2 lg:gap-7">
        {resumen.data.pendientes.length > 0 && (
          <section aria-label="Tus pendientes" className="rounded-lg trazo bg-sol-tinte p-4 shadow-dura">
            <h2 className="text-sobretitulo uppercase">Te necesitan</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {resumen.data.pendientes.map((pendiente) => (
                <li key={pendiente} className="flex items-start gap-2 font-semibold">
                  <span aria-hidden className="mt-2 size-2.5 flex-none rounded-full border-2 bg-sol" />
                  {pendiente}
                </li>
              ))}
            </ul>
          </section>
        )}
        {principal ? (
          <TarjetaVotacion votacion={principal} personas={viaje.personas} soloLectura={!puedeEditar(viaje.personas)} />
        ) : (
          <Tarjeta titulo="Decidir">
            <p className="text-tinta-suave">No hay votaciones abiertas. Proponé algo desde Plan.</p>
          </Tarjeta>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:gap-7">
        {!tipCerrado && (
          <PinzNote tipo="tip" pinz="chispa" title="Tip" onClose={() => setTipCerrado(true)}>
            Tocá un avatar del encabezado para ver qué le falta a cada uno.
          </PinzNote>
        )}
        <Tarjeta titulo="Checklist" extra={<span className="font-display text-titulo-1 font-black numeros">{hechas}/{total}</span>}>
          <div
            role="progressbar"
            aria-label="Checklist del viaje"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={hechas}
            className="h-4.5 overflow-hidden rounded-full trazo bg-papel-hundido"
          >
            <div className="h-full trazo-r bg-sol" style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} />
          </div>
          <ul className="flex flex-col gap-2">
            {proximas.map((tarea) => (
              <li key={tarea.id} className="flex justify-between gap-3">
                <span>{tarea.titulo}</span>
                <b>{conMayuscula(nombreEnElGrupo(viaje.personas, tarea.responsableId) ?? 'Sin asignar')}</b>
              </li>
            ))}
          </ul>
          <Link to={`/viajes/${viaje.id}/baul`} className="self-start rounded-sm font-extrabold underline decoration-2 underline-offset-4">
            Ver el Baúl
          </Link>
        </Tarjeta>
        <Tarjeta titulo="Cuentas" fondo="bg-lavanda-tinte">
          {pendienteDePlata ? (
            <BalanceRow name={pendienteDePlata.persona.nombre} pinz={pendienteDePlata.persona.pinz} amount={pendienteDePlata.monto} />
          ) : (
            <p className="text-tinta-suave">Por ahora no tenés que poner plata.</p>
          )}
          <IrAAgregarGasto viajeId={viaje.id} personas={viaje.personas} />
        </Tarjeta>
      </div>
    </div>
  )
}
