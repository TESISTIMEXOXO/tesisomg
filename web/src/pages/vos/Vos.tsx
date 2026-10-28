import { useState, type FormEvent } from 'react'
import { LogOut, MapPin, MonitorSmartphone, Moon, Sun, type LucideIcon } from 'lucide-react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { Pin } from '../../components/marca/Pin'
import { ArchivosSlot } from '../../components/slots/ArchivosSlot'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useCerrarSesion } from '../../hooks/auth'
import { useAbrirDocumento, useDocumentosPersonales, useSubirDocumentoPersonal } from '../../hooks/baul'
import { useGuardarPerfil, usePerfil } from '../../hooks/perfil'
import { useTema } from '../../hooks/tema'
import { diasHasta, fechaCorta, mesYAnio } from '../../lib/fechas'
import { monto } from '../../lib/moneda'
import type { PreferenciaTema } from '../../lib/tema'
import { DatosPerfilSchema, MonedaSchema, type Perfil } from '../../types/perfil'
import { ELENCO } from '../../pinz/elenco'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-linea py-2 last:border-b-0">
      <dt className="text-tinta-suave">{etiqueta}</dt>
      <dd className="text-right font-bold">{valor ?? 'Sin completar'}</dd>
    </div>
  )
}

const OPCIONES_TEMA: { id: PreferenciaTema; texto: string; icono: LucideIcon }[] = [
  { id: 'claro', texto: 'Claro', icono: Sun },
  { id: 'oscuro', texto: 'Oscuro', icono: Moon },
  { id: 'sistema', texto: 'Como tu dispositivo', icono: MonitorSmartphone },
]

function EditarPerfil({ perfil, alCancelar }: { perfil: Perfil; alCancelar: () => void }) {
  const guardar = useGuardarPerfil()
  const [nombre, setNombre] = useState(perfil.nombre)
  const [moneda, setMoneda] = useState(perfil.moneda)
  const [presupuesto, setPresupuesto] = useState(perfil.preferencias.presupuestoPorNoche?.toString() ?? '')
  const [ritmo, setRitmo] = useState(perfil.preferencias.ritmo ?? '')
  const [comida, setComida] = useState(perfil.preferencias.comida ?? '')
  const [alergias, setAlergias] = useState(perfil.preferencias.alergias ?? '')
  const [aeropuertos, setAeropuertos] = useState(perfil.aeropuertos.join(', '))
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const montoNoche = presupuesto.trim() ? Number(presupuesto) : null
    const datos = DatosPerfilSchema.safeParse({
      nombre,
      pinz: perfil.pinz,
      moneda,
      tema: perfil.tema,
      preferencias: {
        presupuestoPorNoche: montoNoche,
        ritmo: ritmo || null,
        comida: comida.trim() || null,
        alergias: alergias.trim() || null,
      },
      aeropuertos: aeropuertos.split(',').map((item) => item.trim()).filter(Boolean),
    })
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    setError(undefined)
    guardar.mutate(datos.data, { onSuccess: alCancelar })
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <TextField label="Nombre" autoComplete="name" value={nombre} onChange={(evento) => setNombre(evento.target.value)} />
      <label className="flex flex-col gap-1.5 text-etiqueta">
        Moneda
        <select value={moneda} onChange={(evento) => setMoneda(MonedaSchema.parse(evento.target.value))} className="min-h-control rounded-sm trazo bg-papel-elevado px-4 font-semibold shadow-chica">
          {MonedaSchema.options.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
      </label>
      <TextField label="Presupuesto por noche" type="number" min="0" inputMode="numeric" value={presupuesto} onChange={(evento) => setPresupuesto(evento.target.value)} />
      <label className="flex flex-col gap-1.5 text-etiqueta">
        Ritmo
        <select value={ritmo} onChange={(evento) => setRitmo(evento.target.value)} className="min-h-control rounded-sm trazo bg-papel-elevado px-4 font-semibold shadow-chica">
          <option value="">Sin definir</option>
          <option value="tranqui">Tranqui</option>
          <option value="intermedio">Intermedio</option>
          <option value="a full">A full</option>
        </select>
      </label>
      <TextField label="Preferencias de comida" value={comida} onChange={(evento) => setComida(evento.target.value)} />
      <TextField label="Alergias" value={alergias} onChange={(evento) => setAlergias(evento.target.value)} />
      <TextField label="Aeropuertos de salida" hint="Separalos con comas." value={aeropuertos} onChange={(evento) => setAeropuertos(evento.target.value)} />
      {error && <p role="alert" className="text-negativo">{error}</p>}
      {guardar.isError && <p role="alert" className="text-negativo">No pudimos guardar tu perfil. Probá de nuevo.</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primario" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar datos'}</Button>
        <Button variant="fantasma" onClick={alCancelar}>Cancelar</Button>
      </div>
    </form>
  )
}

function Apariencia({ perfil }: { perfil: Perfil }) {
  const { preferencia, elegir } = useTema()
  const guardar = useGuardarPerfil()
  return (
    <Tarjeta titulo="Apariencia">
      <fieldset>
        <legend className="mb-3 text-tinta-suave">Tu preferencia se guarda en tu cuenta.</legend>
        <div className="flex flex-wrap gap-2">
          {OPCIONES_TEMA.map((opcion) => (
            <Chip
              key={opcion.id}
              icon={opcion.icono}
              selected={preferencia === opcion.id}
              disabled={guardar.isPending}
              onClick={() => guardar.mutate(
                {
                  nombre: perfil.nombre,
                  pinz: perfil.pinz,
                  moneda: perfil.moneda,
                  tema: opcion.id,
                  preferencias: perfil.preferencias,
                  aeropuertos: perfil.aeropuertos,
                },
                { onSuccess: () => elegir(opcion.id) },
              )}
            >
              {opcion.texto}
            </Chip>
          ))}
        </div>
        {guardar.isError && <p role="alert" className="mt-3 text-negativo">No pudimos guardar la apariencia. Probá de nuevo.</p>}
      </fieldset>
    </Tarjeta>
  )
}

/** HU-21 y HU-25: tu pinz, preferencias, documentos personales e historial. */
export function Vos() {
  const { data: perfil, isPending, error, refetch } = usePerfil()
  const documentos = useDocumentosPersonales()
  const subir = useSubirDocumentoPersonal()
  const abrir = useAbrirDocumento()
  const cerrarSesion = useCerrarSesion()
  const [editandoPerfil, setEditandoPerfil] = useState(false)

  if (isPending) return <Cargando />
  if (error) return <NoCargo error={error} onReintentar={() => refetch()} />

  const personaje = perfil.pinz ? ELENCO[perfil.pinz] : null
  const porVencer = (documentos.data ?? []).filter((d) => d.vence && diasHasta(d.vence) <= 180)
  const { preferencias } = perfil

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display font-black">Vos</h1>
        <Button variant="secundario" size="sm" icon={LogOut} disabled={cerrarSesion.isPending} onClick={() => cerrarSesion.mutate()}>
          {cerrarSesion.isPending ? 'Cerrando…' : 'Cerrar sesión'}
        </Button>
      </div>
      {cerrarSesion.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos cerrar la sesión. Probá de nuevo.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <div className="flex items-center gap-4">
            <Pin pinz={perfil.pinz ?? 'generico'} size={96} label="" />
            <div className="flex flex-col">
              <p className="font-display text-titulo-1 font-black">{perfil.nombre}</p>
              <p className="font-bold text-tinta-suave">
                {personaje ? `${personaje.nombre}, ${personaje.apodo}` : 'Todavía no elegiste tu pinz'}
              </p>
            </div>
          </div>
          <ButtonLink to="/bienvenida" variant="secundario" size="sm" className="self-start">
            Cambiar tu pinz
          </ButtonLink>
        </Tarjeta>

        <Tarjeta titulo="Preferencias de viaje">
          {editandoPerfil ? (
            <EditarPerfil perfil={perfil} alCancelar={() => setEditandoPerfil(false)} />
          ) : (
            <>
              <dl>
                <Dato etiqueta="Moneda" valor={perfil.moneda} />
                <Dato
                  etiqueta="Presupuesto por noche"
                  valor={preferencias.presupuestoPorNoche === null ? null : monto(preferencias.presupuestoPorNoche)}
                />
                <Dato etiqueta="Ritmo" valor={preferencias.ritmo} />
                <Dato etiqueta="Comida" valor={preferencias.comida} />
                <Dato etiqueta="Alergias" valor={preferencias.alergias} />
                <Dato etiqueta="Salís desde" valor={perfil.aeropuertos.join(', ') || null} />
              </dl>
              <Button variant="secundario" size="sm" onClick={() => setEditandoPerfil(true)}>Editar datos</Button>
            </>
          )}
        </Tarjeta>

        <Tarjeta titulo="Tus documentos">
          {porVencer.map((documento) => (
            <p key={documento.id} role="status" className="rounded-md border-2 border-dashed bg-sol-tinte px-4 py-2.5 font-semibold text-aviso">
              {documento.nombre} vence el {documento.vence && fechaCorta(documento.vence)}.
            </p>
          ))}
          {documentos.isPending && <p className="text-tinta-suave">Cargando tus documentos…</p>}
          {documentos.error && <p className="text-negativo">No pudimos cargar tus documentos.</p>}
          {documentos.data && (
            <ArchivosSlot
              archivos={documentos.data}
              ayuda="DNI, pasaporte o licencia."
              onSubir={(archivo) => subir.mutate(archivo)}
              onAbrir={(id) => abrir.mutate(id)}
            />
          )}
        </Tarjeta>

        <Tarjeta titulo="Lugares que visitaste">
          {perfil.historial.length === 0 ? (
            <p className="text-tinta-suave">Cuando cierres tu primer viaje, sus lugares quedan acá.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {perfil.historial.map((lugar) => (
                <li key={lugar.viajeId} className="flex items-center gap-3">
                  <MapPin size={20} strokeWidth={2} aria-hidden />
                  <span className="font-bold">{lugar.destino}</span>
                  <span className="text-meta text-tinta-suave">{mesYAnio(lugar.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Apariencia perfil={perfil} />
      </div>
    </div>
  )
}
