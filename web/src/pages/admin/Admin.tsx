import { useDeferredValue, useId, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { Buscador } from '../../components/ui/Buscador'
import { Button } from '../../components/ui/Button'
import { Despliegue } from '../../components/ui/Despliegue'
import { MenuOrden } from '../../components/ui/MenuOrden'
import { Etiqueta, Tarjeta } from '../../components/ui/Tarjeta'
import { useSesion } from '../../hooks/auth'
import type { OrdenAdmin } from '../../services/admin'
import {
  useAdminConsultas,
  useAdminRespuestas,
  useAdminResumen,
  useAdminUsuarios,
  useAdminViajes,
  useCambiarBaneoUsuario,
  useCambiarEstadoConsulta,
  useEliminarConsulta,
  useResponderConsulta,
} from '../../hooks/admin'
import { esSuperadmin } from '../../lib/admin'
import { codigoDeError } from '../../services/auth'

function fechaHora(fecha: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha))
}

function Paginacion({
  pagina,
  total,
  porPagina,
  cambiar,
}: {
  pagina: number
  total: number
  porPagina: number
  cambiar: (pagina: number) => void
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (paginas < 2) return null
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="fantasma" size="sm" disabled={pagina <= 1} onClick={() => cambiar(pagina - 1)}>Anterior</Button>
      <span className="text-meta text-tinta-suave">Página {pagina} de {paginas}</span>
      <Button variant="fantasma" size="sm" disabled={pagina >= paginas} onClick={() => cambiar(pagina + 1)}>Siguiente</Button>
    </div>
  )
}

const ORDENES_CONSULTAS = [
  { id: 'nuevo', texto: 'Más nuevas primero' },
  { id: 'antiguo', texto: 'Más antiguas primero' },
  { id: 'alfabetico', texto: 'Por mail, de la A a la Z' },
] as const

const ORDENES_POR_NOMBRE = [
  { id: 'nuevo', texto: 'Más nuevos primero' },
  { id: 'antiguo', texto: 'Más antiguos primero' },
  { id: 'alfabetico', texto: 'Por nombre, de la A a la Z' },
] as const

/** Una lista larga no estira la sección: se scrollea adentro y la paginación queda a la vista. */
function ListaConScroll({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={etiqueta} tabIndex={0} className="max-h-120 overflow-y-auto overscroll-contain rounded-md pr-1">
      {children}
    </div>
  )
}

type SeccionPlegableProps = {
  titulo: string
  cuenta: string
  /** Buscador y orden: aparecen al lado del título solo con la sección abierta. */
  herramientas?: ReactNode
  children: ReactNode
}

/** Una sección del panel que se pliega, con el mismo movimiento que los desplegables de la app. */
function Cuenta({ cuenta, abierta }: { cuenta: string; abierta: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Etiqueta>{cuenta}</Etiqueta>
      <ChevronDown
        size={20}
        aria-hidden
        className={`transition-transform duration-300 motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`}
      />
    </span>
  )
}

function SeccionPlegable({ titulo, cuenta, herramientas, children }: SeccionPlegableProps) {
  const [abierta, setAbierta] = useState(false)
  const idContenido = useId()
  const alternar = () => setAbierta((actual) => !actual)
  return (
    <section className="rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
      {herramientas ? (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto]">
          <h2>
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls={idContenido}
              onClick={alternar}
              className="flex min-h-toque items-center text-left select-none"
            >
              <span className="font-display text-titulo-1 font-black">{titulo}</span>
              <span className="sr-only">, {cuenta}</span>
            </button>
          </h2>
          {abierta && (
            <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 motion-safe:animate-fundido md:col-span-1 md:col-start-2 md:row-start-1">
              {herramientas}
            </div>
          )}
          {/* El lector ya escucha la cuenta en el botón del título: esto repite el clic para el mouse. */}
          <div aria-hidden onClick={alternar} className="cursor-pointer select-none md:col-start-3 md:row-start-1">
            <Cuenta cuenta={cuenta} abierta={abierta} />
          </div>
        </div>
      ) : (
        <h2>
          <button
            type="button"
            aria-expanded={abierta}
            aria-controls={idContenido}
            onClick={alternar}
            className="flex min-h-toque w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 text-left select-none"
          >
            <span className="font-display text-titulo-1 font-black">{titulo}</span>
            <Cuenta cuenta={cuenta} abierta={abierta} />
          </button>
        </h2>
      )}
      <Despliegue abierta={abierta} id={idContenido}>
        {children}
      </Despliegue>
    </section>
  )
}

/** Lo que se le contestó a cada consulta: la respuesta y, debajo, la consulta original. */
function SeccionRespuestas() {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<OrdenAdmin>('nuevo')
  const busquedaDiferida = useDeferredValue(busqueda.trim())
  const respuestas = useAdminRespuestas(pagina, busquedaDiferida, orden)
  const total = respuestas.data?.total ?? 0

  return (
    <SeccionPlegable
      titulo="Respuestas enviadas"
      cuenta={busquedaDiferida ? `${total} resultados` : `${total} total`}
      herramientas={
        <>
          <Buscador
            aria-label="Buscar respuestas por mail, asunto o texto"
            placeholder="Buscar por mail, asunto o texto"
            className="flex-1"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setPagina(1)
            }}
          />
          <MenuOrden
            opciones={ORDENES_CONSULTAS}
            valor={orden}
            onCambiar={(nuevo) => {
              setOrden(nuevo)
              setPagina(1)
            }}
          />
        </>
      }
    >
      <div className="pt-5 flex flex-col gap-4">
        {respuestas.isPending && <p role="status">Cargando respuestas…</p>}
        {respuestas.error && <p role="alert" className="text-negativo">No pudimos cargar las respuestas.</p>}
        {respuestas.data?.items.length === 0 && (
          <p className="text-tinta-suave">{busquedaDiferida ? 'No hay respuestas que coincidan con la búsqueda.' : 'Todavía no respondiste ninguna consulta.'}</p>
        )}
        {respuestas.data && respuestas.data.items.length > 0 && (
          <ListaConScroll etiqueta="Lista de respuestas" key={`respuestas-${pagina}`}>
            <ul className="flex flex-col gap-4">
              {respuestas.data.items.map((respuesta) => (
                <li key={respuesta.id} className="flex flex-col gap-3 rounded-md trazo-fino bg-papel-hundido p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-meta text-tinta-suave">Respuesta a</p>
                      <h3 className="font-bold">{respuesta.consulta.asunto}</h3>
                      <a className="text-meta underline" href={`mailto:${respuesta.consulta.email}`}>{respuesta.consulta.email}</a>
                    </div>
                    <p className="text-meta text-tinta-suave">Enviada {fechaHora(respuesta.enviadaEn)}</p>
                  </div>
                  <p className="whitespace-pre-wrap">{respuesta.texto}</p>
                  <blockquote className="border-l-4 border-linea pl-3 text-meta whitespace-pre-wrap text-tinta-suave">
                    {respuesta.consulta.descripcion}
                  </blockquote>
                </li>
              ))}
            </ul>
          </ListaConScroll>
        )}
        {respuestas.data && (
          <Paginacion pagina={respuestas.data.pagina} total={respuestas.data.total} porPagina={respuestas.data.porPagina} cambiar={setPagina} />
        )}
      </div>
    </SeccionPlegable>
  )
}

export function Admin() {
  const sesion = useSesion()
  if (sesion.isPending) return <Cargando />
  if (!sesion.data || !esSuperadmin(sesion.data.email)) return <Navigate to="/viajes" replace />
  return <PanelAdmin email={sesion.data.email} />
}

function PanelAdmin({ email }: { email: string }) {
  const [paginaConsultas, setPaginaConsultas] = useState(1)
  const [paginaUsuarios, setPaginaUsuarios] = useState(1)
  const [paginaViajes, setPaginaViajes] = useState(1)
  const [busquedaConsultas, setBusquedaConsultas] = useState('')
  const [ordenConsultas, setOrdenConsultas] = useState<OrdenAdmin>('nuevo')
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [ordenUsuarios, setOrdenUsuarios] = useState<OrdenAdmin>('nuevo')
  const [busquedaViajes, setBusquedaViajes] = useState('')
  const [ordenViajes, setOrdenViajes] = useState<OrdenAdmin>('nuevo')
  const [consultaAbierta, setConsultaAbierta] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [consultaRespondida, setConsultaRespondida] = useState<string | null>(null)
  const busquedaDiferida = useDeferredValue(busquedaUsuarios.trim())
  const busquedaConsultasDiferida = useDeferredValue(busquedaConsultas.trim())
  const busquedaViajesDiferida = useDeferredValue(busquedaViajes.trim())
  const resumen = useAdminResumen()
  const consultas = useAdminConsultas(paginaConsultas, busquedaConsultasDiferida, ordenConsultas)
  const usuarios = useAdminUsuarios(paginaUsuarios, busquedaDiferida, ordenUsuarios)
  const viajes = useAdminViajes(paginaViajes, busquedaViajesDiferida, ordenViajes)
  const cambiarEstado = useCambiarEstadoConsulta()
  const eliminar = useEliminarConsulta()
  const responder = useResponderConsulta()
  const cambiarBaneoUsuario = useCambiarBaneoUsuario()

  function enviarRespuesta(evento: FormEvent<HTMLFormElement>, id: string) {
    evento.preventDefault()
    const respuesta = textoRespuesta.trim()
    if (!respuesta) return
    responder.mutate({ id, respuesta }, {
      onSuccess: () => {
        setConsultaRespondida(id)
        setTextoRespuesta('')
      },
    })
  }

  if (resumen.isPending) return <Cargando />
  if (resumen.error) return <NoCargo error={resumen.error} onReintentar={() => void resumen.refetch()} />

  const consultasTotal = consultas.data?.total ?? 0
  const usuariosTotal = usuarios.data?.total ?? 0
  const viajesTotal = viajes.data?.total ?? 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sobretitulo uppercase">Administración</p>
        <h1 className="font-display text-display font-black">Panel superadmin</h1>
        <p className="mt-2 text-tinta-suave">Sesión iniciada como {email}</p>
      </div>

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { titulo: 'Usuarios registrados', valor: resumen.data.usuarios },
          { titulo: 'Viajes', valor: resumen.data.viajes },
          { titulo: 'Consultas recibidas', valor: resumen.data.consultas },
          { titulo: 'Pendientes de atender', valor: resumen.data.consultasPendientes },
        ].map((dato) => (
          <Tarjeta key={dato.titulo} className="gap-1">
            <p className="text-meta text-tinta-suave">{dato.titulo}</p>
            <p className="font-display text-display font-black">{dato.valor}</p>
          </Tarjeta>
        ))}
      </section>

      <SeccionPlegable
        titulo="Consultas de Escribinos"
        cuenta={busquedaConsultasDiferida ? `${consultasTotal} resultados` : `${consultasTotal} total`}
        herramientas={
          <>
            <Buscador
              aria-label="Buscar consultas por mail o asunto"
              placeholder="Buscar por mail o asunto"
              className="flex-1"
              value={busquedaConsultas}
              onChange={(evento) => {
                setBusquedaConsultas(evento.target.value)
                setPaginaConsultas(1)
              }}
            />
            <MenuOrden
              opciones={ORDENES_CONSULTAS}
              valor={ordenConsultas}
              onCambiar={(orden) => {
                setOrdenConsultas(orden)
                setPaginaConsultas(1)
              }}
            />
          </>
        }
      >
        <div className="pt-5 flex flex-col gap-4">
        {consultas.isPending && <p role="status">Cargando consultas…</p>}
        {consultas.error && <p role="alert" className="text-negativo">No pudimos cargar las consultas.</p>}
        {consultas.data?.items.length === 0 && (
          <p className="text-tinta-suave">{busquedaConsultasDiferida ? 'No hay consultas que coincidan con la búsqueda.' : 'Todavía no hay consultas.'}</p>
        )}
        <ListaConScroll etiqueta="Lista de consultas" key={`consultas-${paginaConsultas}`}>
        <ul className="flex flex-col gap-4">
          {consultas.data?.items.map((consulta) => (
            <li key={consulta.id} className="flex flex-col gap-3 rounded-md trazo-fino bg-papel-hundido p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{consulta.asunto}</h3>
                  <a className="text-meta underline" href={`mailto:${consulta.email}`}>{consulta.email}</a>
                  <p className="mt-1 text-meta text-tinta-suave">{fechaHora(consulta.creadaEn)}</p>
                </div>
                <Etiqueta fondo={consulta.atendida ? 'bg-positivo-tinte' : 'bg-sol-tinte'}>
                  {consulta.atendida ? 'Atendida' : 'Pendiente'}
                </Etiqueta>
              </div>
              <p className="whitespace-pre-wrap">{consulta.descripcion}</p>
              <p className="text-meta text-tinta-suave">
                Confirmación: {consulta.confirmacionEnviada ? 'enviada' : 'no enviada'} · Aviso al equipo: {consulta.avisoEnviado ? 'enviado' : 'no enviado'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secundario"
                  size="sm"
                  disabled={responder.isPending}
                  onClick={() => {
                    responder.reset()
                    setConsultaRespondida(null)
                    setTextoRespuesta('')
                    setConsultaAbierta((actual) => actual === consulta.id ? null : consulta.id)
                  }}
                >
                  {consultaAbierta === consulta.id ? 'Cancelar respuesta' : 'Responder por email'}
                </Button>
                <Button
                  variant="secundario"
                  size="sm"
                  disabled={cambiarEstado.isPending}
                  onClick={() => cambiarEstado.mutate({ id: consulta.id, atendida: !consulta.atendida })}
                >
                  {consulta.atendida ? 'Marcar pendiente' : 'Marcar atendida'}
                </Button>
                <Button
                  variant="fantasma"
                  size="sm"
                  disabled={eliminar.isPending}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar la consulta “${consulta.asunto}”? Esta acción no se puede deshacer.`)) {
                      eliminar.mutate(consulta.id)
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            {consultaRespondida === consulta.id && (
              <p role="status" className="text-meta font-semibold text-positivo">Respuesta enviada a {consulta.email} desde Pinz.</p>
            )}
            {consultaAbierta === consulta.id && (
              <form onSubmit={(evento) => enviarRespuesta(evento, consulta.id)} className="flex flex-col items-start gap-3">
                <label htmlFor={`respuesta-${consulta.id}`} className="text-etiqueta">
                  Tu respuesta · se enviará a {consulta.email}
                </label>
                <textarea
                  id={`respuesta-${consulta.id}`}
                  rows={4}
                  maxLength={5000}
                  required
                  value={textoRespuesta}
                  onChange={(evento) => setTextoRespuesta(evento.target.value)}
                  className="w-full resize-y rounded-sm trazo bg-papel-elevado px-4 py-3 font-semibold text-tinta shadow-chica focus-visible:shadow-dura"
                />
                {responder.isError && (
                  <p role="alert" className="text-meta font-semibold text-negativo">
                    {codigoDeError(responder.error) === 'correo-no-configurado'
                      ? 'El correo de Pinz no está configurado en la API (SMTP_URL).'
                      : 'No pudimos enviar la respuesta. Revisá la conexión y probá de nuevo.'}
                  </p>
                )}
                <Button type="submit" variant="primario" size="sm" disabled={responder.isPending || !textoRespuesta.trim()}>
                  {responder.isPending ? 'Enviando…' : 'Enviar respuesta'}
                </Button>
              </form>
            )}
            </li>
          ))}
        </ul>
        </ListaConScroll>
        {(cambiarEstado.isError || eliminar.isError) && (
          <p role="alert" className="text-meta font-semibold text-negativo">No pudimos actualizar la consulta. Probá de nuevo.</p>
        )}
        {consultas.data && (
          <Paginacion pagina={consultas.data.pagina} total={consultas.data.total} porPagina={consultas.data.porPagina} cambiar={setPaginaConsultas} />
        )}
        </div>
      </SeccionPlegable>

      <SeccionRespuestas />

      <SeccionPlegable
        titulo="Usuarios registrados"
        cuenta={busquedaDiferida ? `${usuariosTotal} resultados` : `${usuariosTotal} total`}
        herramientas={
          <>
            <Buscador
              aria-label="Buscar usuarios por nombre o mail"
              placeholder="Buscar por nombre o mail"
              className="flex-1"
              value={busquedaUsuarios}
              onChange={(evento) => {
                setBusquedaUsuarios(evento.target.value)
                setPaginaUsuarios(1)
              }}
            />
            <MenuOrden
              opciones={ORDENES_POR_NOMBRE}
              valor={ordenUsuarios}
              onCambiar={(orden) => {
                setOrdenUsuarios(orden)
                setPaginaUsuarios(1)
              }}
            />
          </>
        }
      >
        <div className="pt-4 flex flex-col gap-3">
        {usuarios.isPending && <p role="status">Cargando usuarios…</p>}
        {usuarios.error && <p role="alert" className="text-negativo">No pudimos cargar los usuarios.</p>}
        {usuarios.data?.items.length === 0 && (
          <p className="text-tinta-suave">
            {busquedaDiferida ? 'No encontramos usuarios con ese nombre o correo.' : 'Todavía no hay usuarios registrados.'}
          </p>
        )}
        <ListaConScroll etiqueta="Lista de usuarios" key={`usuarios-${paginaUsuarios}`}>
        <ul className="flex flex-col divide-y divide-linea">
          {usuarios.data?.items.map((usuario) => (
              <li key={usuario.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="flex flex-wrap items-center gap-2 font-bold">
                  {usuario.nombre || 'Sin nombre'}
                  {usuario.baneado && <Etiqueta fondo="bg-negativo-tinte">Baneado</Etiqueta>}
                </span>
                <a className="text-meta underline" href={`mailto:${usuario.email}`}>{usuario.email}</a>
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <span className="text-meta text-tinta-suave">Registrado {fechaHora(usuario.creadoEn)}</span>
                <Button
                  variant={usuario.baneado ? 'secundario' : 'fantasma'}
                  size="sm"
                  disabled={cambiarBaneoUsuario.isPending || esSuperadmin(usuario.email)}
                  onClick={() => {
                    const accion = usuario.baneado ? 'desbanear' : 'banear'
                    if (window.confirm(`¿Querés ${accion} a ${usuario.email}?`)) {
                      cambiarBaneoUsuario.mutate({ id: usuario.id, baneado: !usuario.baneado })
                    }
                  }}
                >
                  {usuario.baneado ? 'Desbanear' : 'Banear'}
                </Button>
              </span>
            </li>
          ))}
        </ul>
        </ListaConScroll>
        {cambiarBaneoUsuario.isError && (
          <p role="alert" className="text-meta font-semibold text-negativo">
            No pudimos cambiar el estado del usuario. Actualizá la página y probá de nuevo.
          </p>
        )}
        {usuarios.data && (
          <Paginacion pagina={usuarios.data.pagina} total={usuarios.data.total} porPagina={usuarios.data.porPagina} cambiar={setPaginaUsuarios} />
        )}
        </div>
      </SeccionPlegable>

      <SeccionPlegable
        titulo="Viajes y grupos"
        cuenta={busquedaViajesDiferida ? `${viajesTotal} resultados` : `${viajesTotal} total`}
        herramientas={
          <>
            <Buscador
              aria-label="Buscar viajes por nombre o destino"
              placeholder="Buscar por nombre o destino"
              className="flex-1"
              value={busquedaViajes}
              onChange={(evento) => {
                setBusquedaViajes(evento.target.value)
                setPaginaViajes(1)
              }}
            />
            <MenuOrden
              opciones={ORDENES_POR_NOMBRE}
              valor={ordenViajes}
              onCambiar={(orden) => {
                setOrdenViajes(orden)
                setPaginaViajes(1)
              }}
            />
          </>
        }
      >
        <div className="pt-5 flex flex-col gap-4">
        {viajes.isPending && <p role="status">Cargando viajes…</p>}
        {viajes.error && <p role="alert" className="text-negativo">No pudimos cargar los viajes.</p>}
        {viajes.data?.items.length === 0 && (
          <p className="text-tinta-suave">{busquedaViajesDiferida ? 'No hay viajes que coincidan con la búsqueda.' : 'Todavía no hay viajes.'}</p>
        )}
        <ListaConScroll etiqueta="Lista de viajes" key={`viajes-${paginaViajes}`}>
        <ul className="flex flex-col gap-3">
          {viajes.data?.items.map((viaje) => (
            <li key={viaje.id} className="rounded-md trazo-fino bg-papel-hundido p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-bold">{viaje.nombre}</h3>
                  <p className="text-meta text-tinta-suave">{viaje.destino}</p>
                </div>
                <span className="text-meta text-tinta-suave">{viaje.personas.length} integrantes</span>
              </div>
              <p className="mt-2 text-meta">
                Organiza: {viaje.creador?.nombre || viaje.creador?.email || 'Cuenta no disponible'}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Integrantes de ${viaje.nombre}`}>
                {viaje.personas.map((persona, indice) => (
                  <li key={`${persona.nombre}-${indice}`}>
                    <Etiqueta>{persona.nombre} · {persona.rol}</Etiqueta>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        </ListaConScroll>
        {viajes.data && (
          <Paginacion pagina={viajes.data.pagina} total={viajes.data.total} porPagina={viajes.data.porPagina} cambiar={setPaginaViajes} />
        )}
        </div>
      </SeccionPlegable>
    </div>
  )
}
