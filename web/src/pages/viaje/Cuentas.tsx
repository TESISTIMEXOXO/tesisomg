import { useState } from 'react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { SaldosSlot } from '../../components/slots/SaldosSlot'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { useConfirmarPago, useGastos, usePagos, useRechazarPago, useRegistrarPago, useSaldos, useSimplificarCuentas } from '../../hooks/gastos'
import { useViajeActual } from '../../layouts/contextoViaje'
import { mensajeDeCuentas } from '../../lib/erroresCuentas'
import { fechaCorta } from '../../lib/fechas'
import { monto } from '../../lib/moneda'
import type { Gasto } from '../../types/gasto'
import type { Persona } from '../../types/persona'
import { FormularioGasto } from './FormularioGasto'
import { IrAAgregarGasto } from './IrAAgregarGasto'
import { nombreEnElGrupo, puedeEditar } from './nombres'

/** Los pagos que te avisaron y todavía tenés que confirmar. Si no hay ninguno, no se muestra. */
function PagosPorConfirmar({ viajeId, personas }: { viajeId: string; personas: Persona[] }) {
  const pagos = usePagos(viajeId)
  const confirmar = useConfirmarPago(viajeId)
  const rechazar = useRechazarPago(viajeId)
  const yo = personas.find((persona) => persona.esVos)?.id
  const pendientes = (pagos.data ?? []).filter((pago) => pago.estado === 'pendiente' && pago.acreedorId === yo)
  const error = confirmar.error ?? rechazar.error

  if (pendientes.length === 0) return null

  return (
    <Tarjeta titulo="Te avisaron que te pagaron">
      <ul className="flex flex-col gap-3">
        {pendientes.map((pago) => (
          <li key={pago.id} className="flex flex-col gap-2">
            <span>
              {nombreEnElGrupo(personas, pago.deudorId)} te pasó {monto(pago.monto)}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={confirmar.isPending || rechazar.isPending} onClick={() => confirmar.mutate(pago.id)}>
                Confirmar
              </Button>
              <Button variant="secundario" size="sm" disabled={confirmar.isPending || rechazar.isPending} onClick={() => rechazar.mutate(pago.id)}>
                No me llegó
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="font-semibold text-negativo">
          {mensajeDeCuentas(error)}
        </p>
      )}
    </Tarjeta>
  )
}

/** Cuentas: los gastos del grupo y cómo quedás con cada uno. */
export function Cuentas() {
  const { viaje, etapa } = useViajeActual()
  const gastos = useGastos(viaje.id)
  const saldos = useSaldos(viaje.id)
  const registrarPago = useRegistrarPago(viaje.id)
  const simplificar = useSimplificarCuentas(viaje.id)
  const editable = puedeEditar(viaje.personas)
  const [editando, setEditando] = useState<Gasto | null>(null)
  const yo = viaje.personas.find((persona) => persona.esVos)
  const puedeCambiar = (gasto: Gasto) => editable && (gasto.creadoPorId === yo?.id || yo?.rol === 'organizador')

  if (gastos.isPending) return <Cargando pinz="vuelto" />
  if (gastos.error) return <NoCargo error={gastos.error} onReintentar={() => gastos.refetch()} />

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-7">
      <div className="flex flex-col gap-8 lg:gap-7">
        <Tarjeta titulo="Cómo quedás" fondo="bg-lavanda-tinte">
          {saldos.error ? (
            <p role="alert" className="text-negativo">
              No pudimos cargar los saldos.
            </p>
          ) : (
            <SaldosSlot
              saldos={saldos.data?.saldos ?? null}
              moneda={saldos.data?.moneda ?? 'ARS'}
              onRegistrarPago={(personaId) => registrarPago.mutate(personaId)}
            />
          )}
          {registrarPago.error && (
            <p role="alert" className="font-semibold text-negativo">
              {mensajeDeCuentas(registrarPago.error)}
            </p>
          )}
          {editable && (
            <div className="flex flex-wrap gap-3">
              <IrAAgregarGasto viajeId={viaje.id} personas={viaje.personas} />
              {!saldos.data?.simplificadas && (
                <Button variant="secundario" size="sm" disabled={simplificar.isPending} onClick={() => simplificar.mutate()}>
                  Simplificar cuentas
                </Button>
              )}
            </div>
          )}
          {saldos.data?.simplificadas && <p className="text-meta text-tinta-suave">Cuentas simplificadas</p>}
          {simplificar.error && (
            <p role="alert" className="font-semibold text-negativo">
              {mensajeDeCuentas(simplificar.error)}
            </p>
          )}
        </Tarjeta>
        <PagosPorConfirmar viajeId={viaje.id} personas={viaje.personas} />
        {gastos.data.length === 0 ? (
          <PinzNote tipo="vacio" pinz="vuelto" title="Todavía nadie puso un peso">
            Cuando alguien pague algo, anotalo acá.
          </PinzNote>
        ) : (
          <Tarjeta titulo="Gastos">
            <ul className="flex flex-col">
              {gastos.data.map((gasto) => {
                const tuParte = gasto.partes.find((parte) => parte.personaId === yo?.id)
                const contenido = (
                  <>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-bold">{gasto.descripcion}</span>
                      <span className="text-meta text-tinta-suave">
                        Lo pagó {nombreEnElGrupo(viaje.personas, gasto.pagoId)} ·{' '}
                        {fechaCorta(gasto.fecha)}
                      </span>
                      {tuParte && <span className="text-meta text-tinta-suave">Tu parte: {monto(tuParte.monto)}</span>}
                    </span>
                    <span className="font-display text-titulo-2 font-black whitespace-nowrap numeros">{monto(gasto.monto)}</span>
                  </>
                )
                return (
                  <li key={gasto.id} className="border-b border-linea last:border-b-0">
                    {puedeCambiar(gasto) ? (
                      <button type="button" onClick={() => setEditando(gasto)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                        {contenido}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-3 py-3">{contenido}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Tarjeta>
        )}
      </div>
      {editable && (
        <FormularioGasto
          key={editando?.id ?? 'nuevo'}
          viajeId={viaje.id}
          etapa={etapa}
          personas={viaje.personas}
          gasto={editando}
          onListo={() => setEditando(null)}
        />
      )}
      {!editable && <p className="text-tinta-suave">Tenés rol de lector: podés ver las cuentas, pero no cargar gastos.</p>}
    </div>
  )
}
