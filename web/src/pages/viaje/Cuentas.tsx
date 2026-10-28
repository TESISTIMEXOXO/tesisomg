import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { ComprobanteSlot } from '../../components/slots/ComprobanteSlot'
import { SaldosSlot } from '../../components/slots/SaldosSlot'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useAgregarGasto, useGastos, useLeerComprobante, useRegistrarPago, useSaldos, useSimplificarCuentas } from '../../hooks/gastos'
import { useViajeActual } from '../../layouts/contextoViaje'
import { fechaCorta } from '../../lib/fechas'
import { monto } from '../../lib/moneda'
import { NuevoGastoSchema, type NuevoGasto } from '../../types/gasto'
import type { Persona } from '../../types/persona'
import type { Etapa } from '../../types/viaje'
import { IrAAgregarGasto } from './IrAAgregarGasto'
import { nombreEnElGrupo, puedeEditar } from './nombres'

/** HU-15: cargar un gasto. Si falla, lo cargado no se pierde. */
function AgregarGasto({ viajeId, etapa, personas }: { viajeId: string; etapa: Etapa; personas: Persona[] }) {
  const agregar = useAgregarGasto(viajeId)
  const leer = useLeerComprobante(viajeId)
  const [descripcion, setDescripcion] = useState('')
  const [importe, setImporte] = useState('')
  const [division, setDivision] = useState<NuevoGasto['division']>('iguales')
  const [participantes, setParticipantes] = useState<string[]>(() => personas.map((persona) => persona.id))
  const [errores, setErrores] = useState<Partial<Record<'descripcion' | 'monto', string>>>({})
  const formulario = useRef<HTMLFormElement>(null)
  const { hash, key } = useLocation()

  // Los atajos "Agregar gasto" llegan con #nuevo-gasto: se baja al formulario y queda listo para escribir.
  useEffect(() => {
    if (hash !== '#nuevo-gasto' || !formulario.current) return
    formulario.current.scrollIntoView({ block: 'start' })
    formulario.current.querySelector('input')?.focus({ preventScroll: true })
  }, [hash, key])

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = NuevoGastoSchema.safeParse({
      descripcion,
      monto: importe ? Number(importe.replace(/\./g, '')) : undefined,
      division,
      participantes: division === 'consumo' ? participantes : [],
    })
    if (!resultado.success) {
      const nuevos: typeof errores = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as 'descripcion' | 'monto'
        nuevos[campo] ??= issue.message
      }
      setErrores(nuevos)
      return
    }
    setErrores({})
    agregar.mutate(resultado.data, {
      onSuccess: () => {
        setDescripcion('')
        setImporte('')
      },
    })
  }

  return (
    <Tarjeta titulo="Agregar gasto" className="scroll-mt-6">
      <form ref={formulario} id="nuevo-gasto" onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <TextField label="¿Qué fue?" placeholder="Nafta, súper, entradas…" value={descripcion} error={errores.descripcion} onChange={(evento) => setDescripcion(evento.target.value)} />
        <TextField
          label="Monto"
          inputMode="numeric"
          placeholder="$ 0"
          value={importe}
          error={errores.monto}
          onChange={(evento) => setImporte(evento.target.value.replace(/[^\d.]/g, ''))}
        />
        <fieldset>
          <legend className="mb-2 text-etiqueta">¿Cómo se divide?</legend>
          <div className="flex gap-2">
            <Chip tone={etapa} selected={division === 'iguales'} onClick={() => setDivision('iguales')}>
              Partes iguales
            </Chip>
            <Chip tone={etapa} selected={division === 'consumo'} onClick={() => setDivision('consumo')}>
              Por consumo
            </Chip>
          </div>
          {division === 'consumo' && (
            <fieldset className="mt-3 flex flex-col gap-2">
              <legend className="mb-2 text-etiqueta">¿Quiénes consumieron?</legend>
              {personas.map((persona) => (
                <label key={persona.id} className="flex min-h-toque items-center gap-2">
                  <input
                    type="checkbox"
                    checked={participantes.includes(persona.id)}
                    onChange={(evento) => setParticipantes((actuales) =>
                      evento.target.checked
                        ? [...actuales, persona.id]
                        : actuales.filter((id) => id !== persona.id),
                    )}
                  />
                  {persona.nombre}{persona.esVos ? ' (vos)' : ''}
                </label>
              ))}
              {participantes.length === 0 && <p className="text-meta text-negativo">Elegí al menos una persona.</p>}
            </fieldset>
          )}
        </fieldset>
        {agregar.isError && (
          <p role="alert" className="font-semibold text-negativo">
            No pudimos guardar el gasto. Revisá la conexión y probá de nuevo.
          </p>
        )}
        <Button type="submit" full disabled={agregar.isPending} className="md:w-auto md:self-start">
          {agregar.isPending ? 'Guardando…' : 'Agregar gasto'}
        </Button>
      </form>
      <ComprobanteSlot onEscanear={(archivo) => leer.mutate(archivo)} />
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
              onRegistrarPago={editable ? (personaId) => registrarPago.mutate(personaId) : undefined}
            />
          )}
          {editable && (
            <div className="flex flex-wrap gap-3">
              <IrAAgregarGasto viajeId={viaje.id} personas={viaje.personas} />
              <Button variant="secundario" size="sm" disabled={simplificar.isPending} onClick={() => simplificar.mutate()}>
                Simplificar cuentas
              </Button>
            </div>
          )}
        </Tarjeta>
        {gastos.data.length === 0 ? (
          <PinzNote tipo="vacio" pinz="vuelto" title="Todavía nadie puso un peso">
            Cuando alguien pague algo, anotalo acá.
          </PinzNote>
        ) : (
          <Tarjeta titulo="Gastos">
            <ul className="flex flex-col">
              {gastos.data.map((gasto) => (
                <li key={gasto.id} className="flex items-center justify-between gap-3 border-b border-linea py-3 last:border-b-0">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{gasto.descripcion}</span>
                    <span className="text-meta text-tinta-suave">
                      Lo pagó {nombreEnElGrupo(viaje.personas, gasto.pagoId)} ·{' '}
                      {fechaCorta(gasto.fecha)}
                    </span>
                  </span>
                  <span className="font-display text-titulo-2 font-black whitespace-nowrap numeros">{monto(gasto.monto)}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
      </div>
      {editable && <AgregarGasto viajeId={viaje.id} etapa={etapa} personas={viaje.personas} />}
      {!editable && <p className="text-tinta-suave">Tenés rol de lector: podés ver las cuentas, pero no cargar gastos.</p>}
    </div>
  )
}
