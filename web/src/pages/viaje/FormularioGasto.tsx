import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ComprobanteSlot } from '../../components/slots/ComprobanteSlot'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useAgregarGasto, useBorrarGasto, useEditarGasto, useLeerComprobante } from '../../hooks/gastos'
import { mensajeDeCuentas } from '../../lib/erroresCuentas'
import { monto } from '../../lib/moneda'
import { NuevoGastoSchema, type Gasto, type NuevoGasto } from '../../types/gasto'
import type { Persona } from '../../types/persona'
import type { Etapa } from '../../types/viaje'

const PROPINAS = [0, 10, 15]

const aNumero = (texto: string) => (texto ? Number(texto.replace(/\./g, '')) : 0)
const soloNumeros = (texto: string) => texto.replace(/[^\d.]/g, '')

type Props = {
  viajeId: string
  etapa: Etapa
  personas: Persona[]
  /** El gasto que se está editando. null para cargar uno nuevo. */
  gasto: Gasto | null
  onListo: () => void
}

/** HU-15: cargar o editar un gasto. Si falla, lo cargado no se pierde. */
export function FormularioGasto({ viajeId, etapa, personas, gasto, onListo }: Props) {
  const agregar = useAgregarGasto(viajeId)
  const editar = useEditarGasto(viajeId)
  const borrar = useBorrarGasto(viajeId)
  const leer = useLeerComprobante(viajeId)
  const yo = personas.find((persona) => persona.esVos)?.id ?? ''
  const todos = personas.map((persona) => persona.id)
  const consumoGuardado = gasto?.division === 'consumo' ? gasto : null

  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '')
  const [importe, setImporte] = useState(gasto ? String(gasto.monto - gasto.propina) : '')
  const [division, setDivision] = useState<NuevoGasto['division']>(gasto?.division ?? 'iguales')
  const [pagoId, setPagoId] = useState(gasto?.pagoId ?? yo)
  const [fecha, setFecha] = useState(gasto?.fecha ?? '')
  const [participantes, setParticipantes] = useState<string[]>(gasto?.participantes.length ? gasto.participantes : todos)
  const [consumos, setConsumos] = useState<Record<string, string>>(() =>
    Object.fromEntries((consumoGuardado?.consumos ?? []).map((consumo) => [consumo.personaId, String(consumo.monto)])),
  )
  const [propina, setPropina] = useState(consumoGuardado?.propinaPorcentaje ?? 0)
  const [errores, setErrores] = useState<Partial<Record<'descripcion' | 'monto' | 'fecha', string>>>({})
  const [confirmaBorrar, setConfirmaBorrar] = useState(false)
  const [avisoLectura, setAvisoLectura] = useState<string | null>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const { hash, key } = useLocation()

  // Los atajos "Agregar gasto" llegan con #nuevo-gasto: se baja al formulario y queda listo para escribir.
  useEffect(() => {
    if ((hash !== '#nuevo-gasto' && !gasto) || !formulario.current) return
    formulario.current.scrollIntoView({ block: 'start' })
    formulario.current.querySelector('input')?.focus({ preventScroll: true })
  }, [hash, key, gasto])

  const subtotal = aNumero(importe)
  const repartido = participantes.reduce((total, id) => total + aNumero(consumos[id] ?? ''), 0)
  const falta = subtotal - repartido
  const totalConPropina = subtotal + Math.round((subtotal * propina) / 100)
  const guardando = agregar.isPending || editar.isPending
  const errorGuardar = agregar.error ?? editar.error ?? borrar.error
  const quedaSinRepartir = division === 'consumo' && falta !== 0

  /** Lo leído sólo completa el formulario: nada se guarda hasta que la persona lo revisa. */
  function escanear(archivo: File) {
    setAvisoLectura(null)
    leer.mutate(archivo, {
      onSuccess: (lectura) => {
        if (lectura.descripcion) setDescripcion(lectura.descripcion)
        if (lectura.fecha) setFecha(lectura.fecha)
        if (lectura.monedaDistinta) {
          setImporte('')
          setAvisoLectura(`El comprobante dice ${lectura.monto} ${lectura.moneda}. Pasalo a la moneda del viaje y escribilo en Monto.`)
        } else {
          setImporte(String(lectura.monto))
          setAvisoLectura('Revisá que esté bien y elegí quién pagó y entre quiénes se divide.')
        }
        formulario.current?.scrollIntoView({ block: 'start' })
      },
    })
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = NuevoGastoSchema.safeParse({
      descripcion,
      monto: importe ? subtotal : undefined,
      division,
      pagoId,
      ...(fecha ? { fecha } : {}),
      participantes,
      ...(division === 'consumo'
        ? { consumos: participantes.map((personaId) => ({ personaId, monto: aNumero(consumos[personaId] ?? '') })), propina }
        : {}),
    })
    if (!resultado.success) {
      const nuevos: typeof errores = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (campo === 'descripcion' || campo === 'monto' || campo === 'fecha') nuevos[campo] ??= issue.message
      }
      setErrores(nuevos)
      return
    }
    setErrores({})
    if (participantes.length === 0 || quedaSinRepartir) return
    const alTerminar = {
      onSuccess: () => {
        setDescripcion('')
        setImporte('')
        setFecha('')
        setConsumos({})
        setPropina(0)
        onListo()
      },
    }
    if (gasto) editar.mutate({ gastoId: gasto.id, datos: resultado.data }, alTerminar)
    else agregar.mutate(resultado.data, alTerminar)
  }

  return (
    <Tarjeta titulo={gasto ? 'Editar gasto' : 'Agregar gasto'} className="scroll-mt-6">
      <form ref={formulario} id="nuevo-gasto" onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {avisoLectura && <p role="status" className="font-semibold">{avisoLectura}</p>}
        <TextField label="¿Qué fue?" placeholder="Nafta, súper, entradas…" value={descripcion} error={errores.descripcion} onChange={(evento) => setDescripcion(evento.target.value)} />
        <TextField
          label="Monto"
          inputMode="numeric"
          placeholder="$ 0"
          value={importe}
          error={errores.monto}
          onChange={(evento) => setImporte(soloNumeros(evento.target.value))}
        />
        <TextField label="Fecha" type="date" hint="Si no ponés nada, queda hoy." value={fecha} error={errores.fecha} onChange={(evento) => setFecha(evento.target.value)} />
        <fieldset>
          <legend className="mb-2 text-etiqueta">¿Quién pagó?</legend>
          <div className="flex flex-wrap gap-2">
            {personas.map((persona) => (
              <Chip key={persona.id} tone={etapa} selected={pagoId === persona.id} onClick={() => setPagoId(persona.id)}>
                {persona.esVos ? 'Vos' : persona.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>
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
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-etiqueta">¿Entre quiénes?</legend>
          {personas.map((persona) => {
            const elegida = participantes.includes(persona.id)
            return (
              <div key={persona.id} className="flex min-h-toque items-center gap-3">
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={elegida}
                    onChange={(evento) => setParticipantes((actuales) =>
                      evento.target.checked ? [...actuales, persona.id] : actuales.filter((id) => id !== persona.id),
                    )}
                  />
                  {persona.nombre}{persona.esVos ? ' (vos)' : ''}
                </label>
                {division === 'consumo' && elegida && (
                  <input
                    aria-label={`Lo que consumió ${persona.nombre}`}
                    inputMode="numeric"
                    placeholder="$ 0"
                    value={consumos[persona.id] ?? ''}
                    onChange={(evento) => {
                      const valor = soloNumeros(evento.target.value)
                      setConsumos((actuales) => ({ ...actuales, [persona.id]: valor }))
                    }}
                    className="min-h-control w-32 rounded-md trazo bg-papel-elevado px-3 text-right"
                  />
                )}
              </div>
            )
          })}
          {participantes.length === 0 && <p className="text-meta text-negativo">Elegí al menos una persona.</p>}
          {division === 'consumo' && falta > 0 && <p className="text-meta text-negativo">Faltan {monto(falta)} por repartir</p>}
          {division === 'consumo' && falta < 0 && <p className="text-meta text-negativo">Te pasaste por {monto(-falta)}</p>}
        </fieldset>
        {division === 'consumo' && (
          <fieldset>
            <legend className="mb-2 text-etiqueta">Propina</legend>
            <div className="flex gap-2">
              {PROPINAS.map((porcentaje) => (
                <Chip key={porcentaje} tone={etapa} selected={propina === porcentaje} onClick={() => setPropina(porcentaje)}>
                  {porcentaje === 0 ? 'Sin propina' : `${porcentaje}%`}
                </Chip>
              ))}
            </div>
            {subtotal > 0 && <p className="mt-2 font-semibold">Total con propina: {monto(totalConPropina)}</p>}
          </fieldset>
        )}
        {errorGuardar && (
          <p role="alert" className="font-semibold text-negativo">
            {mensajeDeCuentas(errorGuardar)}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" full disabled={guardando} className="md:w-auto">
            {guardando ? 'Guardando…' : gasto ? 'Guardar cambios' : 'Agregar gasto'}
          </Button>
          {gasto && (
            <Button type="button" variant="secundario" onClick={onListo}>
              Cancelar
            </Button>
          )}
          {gasto && (
            <Button
              type="button"
              variant="secundario"
              disabled={borrar.isPending}
              onClick={() => {
                if (!confirmaBorrar) {
                  setConfirmaBorrar(true)
                  return
                }
                borrar.mutate(gasto.id, { onSuccess: onListo })
              }}
            >
              {confirmaBorrar ? 'Sí, borrar el gasto' : 'Borrar gasto'}
            </Button>
          )}
        </div>
      </form>
      {!gasto && <ComprobanteSlot onEscanear={escanear} leyendo={leer.isPending} error={leer.error ? mensajeDeCuentas(leer.error) : null} />}
    </Tarjeta>
  )
}
