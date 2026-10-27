import { Cargando, NoCargo } from '../../../components/marca/Estados'
import { PinzNote } from '../../../components/marca/PinzNote'
import { SaldosSlot } from '../../../components/slots/SaldosSlot'
import { Button } from '../../../components/ui/Button'
import { Tarjeta } from '../../../components/ui/Tarjeta'
import { useRegistrarPago, useSaldos, useSimplificarCuentas } from '../../../hooks/gastos'
import { useViajeActual } from '../../../layouts/contextoViaje'
import { IrAAgregarGasto } from '../IrAAgregarGasto'

/** Post-viaje: ¿cómo quedamos con la plata y qué nos llevamos? */
export function ResumenPostViaje() {
  const { viaje } = useViajeActual()
  const { data, isPending, error, refetch } = useSaldos(viaje.id)
  const registrarPago = useRegistrarPago(viaje.id)
  const simplificar = useSimplificarCuentas(viaje.id)

  if (isPending) return <Cargando pinz="postal" />
  if (error) return <NoCargo error={error} onReintentar={() => refetch()} />

  const todosAMano = data.saldos.every((s) => s.monto === 0)

  return (
    <div className="flex max-w-180 flex-col gap-8">
      {todosAMano && (
        <PinzNote tipo="festejo" pinz="vuelto" title="Listo, quedaron todos a mano" action="Repetir viaje" actionTo={`/viajes/${viaje.id}/grupo`}>
          El viaje se cerró. ¿Lo repetimos?
        </PinzNote>
      )}
      <Tarjeta titulo="Cómo quedás con cada uno" fondo="bg-lavanda-tinte">
        <SaldosSlot saldos={data.saldos} moneda={data.moneda} onRegistrarPago={(personaId) => registrarPago.mutate(personaId)} />
        <div className="flex flex-wrap gap-3">
          <IrAAgregarGasto viajeId={viaje.id} personas={viaje.personas} />
          {!todosAMano && (
            <Button variant="secundario" size="sm" disabled={simplificar.isPending} onClick={() => simplificar.mutate()}>
              Simplificar cuentas
            </Button>
          )}
        </div>
      </Tarjeta>
    </div>
  )
}
