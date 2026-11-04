import { useDeferredValue, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { Button } from '../../components/ui/Button'
import { Etiqueta, Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useSesion } from '../../hooks/auth'
import type { OrdenUsuarios } from '../../services/admin'
import {
  useAdminConsultas,
  useAdminResumen,
  useAdminUsuarios,
  useAdminViajes,
  useCambiarEstadoConsulta,
  useEliminarConsulta,
  useResponderConsulta,
} from '../../hooks/admin'
import { SUPERADMIN_EMAIL } from '../../lib/admin'
import { codigoDeError } from '../../services/auth'

function fechaHora(fecha: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha))
}

function ordenUsuario(valor: string): OrdenUsuarios {
  if (valor === 'antiguo' || valor === 'alfabetico') return valor
  return 'nuevo'
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

export function Admin() {
  const sesion = useSesion()
  if (sesion.isPending) return <Cargando />
  if (sesion.data?.email.toLowerCase() !== SUPERADMIN_EMAIL) return <Navigate to="/viajes" replace />
  return <PanelAdmin email={sesion.data.email} />
}

function PanelAdmin({ email }: { email: string }) {
  const [paginaConsultas, setPaginaConsultas] = useState(1)
  const [paginaUsuarios, setPaginaUsuarios] = useState(1)
  const [paginaViajes, setPaginaViajes] = useState(1)
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [ordenUsuarios, setOrdenUsuarios] = useState<OrdenUsuarios>('nuevo')
  const [consultaAbierta, setConsultaAbierta] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [consultaRespondida, setConsultaRespondida] = useState<string | null>(null)
  const busquedaDiferida = useDeferredValue(busquedaUsuarios.trim())
  const resumen = useAdminResumen()
  const consultas = useAdminConsultas(paginaConsultas)
  const usuarios = useAdminUsuarios(paginaUsuarios, busquedaDiferida, ordenUsuarios)
  const viajes = useAdminViajes(paginaViajes)
  const cambiarEstado = useCambiarEstadoConsulta()
  const eliminar = useEliminarConsulta()
  const responder = useResponderConsulta()

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

      <details className="group rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-titulo-1 font-black">Consultas de Escribinos</h2>
          <span className="flex items-center gap-3">
            <Etiqueta>{consultasTotal} total</Etiqueta>
            <ChevronDown className="transition-transform group-open:rotate-180" size={20} aria-hidden />
          </span>
        </summary>
        <div className="mt-5 flex flex-col gap-4">
        {consultas.isPending && <p role="status">Cargando consultas…</p>}
        {consultas.error && <p role="alert" className="text-negativo">No pudimos cargar las consultas.</p>}
        {consultas.data?.items.length === 0 && <p className="text-tinta-suave">Todavía no hay consultas.</p>}
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
        {(cambiarEstado.isError || eliminar.isError) && (
          <p role="alert" className="text-meta font-semibold text-negativo">No pudimos actualizar la consulta. Probá de nuevo.</p>
        )}
        {consultas.data && (
          <Paginacion pagina={consultas.data.pagina} total={consultas.data.total} porPagina={consultas.data.porPagina} cambiar={setPaginaConsultas} />
        )}
        </div>
      </details>

      <details className="group rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-titulo-1 font-black">Usuarios registrados</h2>
          <span className="flex items-center gap-3">
            <Etiqueta>{busquedaDiferida ? `${usuariosTotal} resultados` : `${usuariosTotal} total`}</Etiqueta>
            <ChevronDown className="transition-transform group-open:rotate-180" size={20} aria-hidden />
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Buscar usuario"
            type="search"
            placeholder="Nombre o correo electrónico"
            className="min-w-52 max-w-md flex-1"
            value={busquedaUsuarios}
            onChange={(evento) => {
              setBusquedaUsuarios(evento.target.value)
              setPaginaUsuarios(1)
            }}
          />
          <label className="flex min-w-48 flex-col gap-1">
            <span className="text-meta font-semibold">Ordenar usuarios</span>
            <select
              value={ordenUsuarios}
              onChange={(evento) => {
                setOrdenUsuarios(ordenUsuario(evento.target.value))
                setPaginaUsuarios(1)
              }}
              className="min-h-10 rounded-sm trazo bg-papel-elevado px-3 text-sm font-semibold"
            >
              <option value="nuevo">Más nuevos primero</option>
              <option value="antiguo">Más antiguos primero</option>
              <option value="alfabetico">Orden alfabético (A–Z)</option>
            </select>
          </label>
          {usuarios.data && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-meta text-tinta-suave">
                {usuariosTotal === 0
                  ? '0 usuarios'
                  : `${(paginaUsuarios - 1) * usuarios.data.porPagina + 1}–${Math.min(paginaUsuarios * usuarios.data.porPagina, usuariosTotal)} de ${usuariosTotal}`}
                {' · '}Página {paginaUsuarios} de {Math.max(1, Math.ceil(usuariosTotal / usuarios.data.porPagina))}
              </span>
              <Button
                variant="fantasma"
                size="sm"
                icon={ChevronLeft}
                aria-label="Página anterior de usuarios"
                disabled={paginaUsuarios <= 1 || usuarios.isFetching}
                onClick={() => setPaginaUsuarios((pagina) => Math.max(1, pagina - 1))}
              />
              <Button
                variant="fantasma"
                size="sm"
                icon={ChevronRight}
                aria-label="Página siguiente de usuarios"
                disabled={paginaUsuarios >= Math.ceil(usuariosTotal / usuarios.data.porPagina) || usuarios.isFetching}
                onClick={() => setPaginaUsuarios((pagina) => pagina + 1)}
              />
            </div>
          )}
          </div>
        {usuarios.isPending && <p role="status">Cargando usuarios…</p>}
        {usuarios.error && <p role="alert" className="text-negativo">No pudimos cargar los usuarios.</p>}
        {usuarios.data?.items.length === 0 && (
          <p className="text-tinta-suave">
            {busquedaDiferida ? 'No encontramos usuarios con ese nombre o correo.' : 'Todavía no hay usuarios registrados.'}
          </p>
        )}
        <ul className="flex flex-col divide-y divide-linea">
          {usuarios.data?.items.map((usuario) => (
            <li key={usuario.id} className="flex flex-wrap justify-between gap-2 py-3">
              <span>
                <span className="block font-bold">{usuario.nombre || 'Sin nombre'}</span>
                <a className="text-meta underline" href={`mailto:${usuario.email}`}>{usuario.email}</a>
              </span>
              <span className="text-meta text-tinta-suave">Registrado {fechaHora(usuario.creadoEn)}</span>
            </li>
          ))}
        </ul>
        </div>
      </details>

      <details className="group rounded-lg trazo bg-papel-elevado p-4 shadow-grande md:p-6">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-titulo-1 font-black">Viajes y grupos</h2>
          <span className="flex items-center gap-3">
            <Etiqueta>{viajesTotal} total</Etiqueta>
            <ChevronDown className="transition-transform group-open:rotate-180" size={20} aria-hidden />
          </span>
        </summary>
        <div className="mt-5 flex flex-col gap-4">
        {viajes.isPending && <p role="status">Cargando viajes…</p>}
        {viajes.error && <p role="alert" className="text-negativo">No pudimos cargar los viajes.</p>}
        {viajes.data?.items.length === 0 && <p className="text-tinta-suave">Todavía no hay viajes.</p>}
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
        {viajes.data && (
          <Paginacion pagina={viajes.data.pagina} total={viajes.data.total} porPagina={viajes.data.porPagina} cambiar={setPaginaViajes} />
        )}
        </div>
      </details>
    </div>
  )
}
