import { UserMinus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { QrSlot } from '../../components/slots/QrSlot'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useCambiarRol, useInvitacionGrupo, useInvitarPorMail, useMovimientos, useRepetirViaje } from '../../hooks/grupo'
import { useViajeActual } from '../../layouts/contextoViaje'
import { cuandoEnDias } from '../../lib/fechas'
import { ELENCO } from '../../pinz/elenco'
import { codigoDeError } from '../../services/auth'
import { RolSchema, type Persona, type Rol } from '../../types/persona'
import { CompartirInvitacion } from './CompartirInvitacion'
import { DestinosYFechas } from './DestinosYFechas'
import { SacarDelViaje } from './SacarDelViaje'
import { esOrganizador, puedeEditar } from './nombres'

const ROLES: Record<Rol, string> = { organizador: 'Organizador', miembro: 'Miembro', lector: 'Solo lectura' }

/*
 * Las dos listas crecen con el viaje, así que bajan con scroll. En mobile tienen un tope fijo; en desktop
 * se reparten mitad y mitad el alto de la columna de al lado (de "Invitar al grupo" a "Repetir el viaje").
 * Con tabIndex también se recorren con el teclado.
 */
const LISTA_CON_SCROLL = 'flex max-h-72 flex-col overflow-y-auto overscroll-contain rounded-sm pr-2 lg:max-h-none lg:min-h-0 lg:flex-1'

/** Cada rechazo del backend dice qué pasó; "revisá el correo" queda solo para fallas de verdad. */
function mensajeErrorInvitacion(error: unknown) {
  switch (codigoDeError(error)) {
    case 'ya-es-miembro':
      return 'Esa persona ya está en el viaje.'
    case 'persona-baneada':
      return 'A esa persona la sacaron tres veces de este viaje: ya no puede volver.'
    case 'sin-permiso':
      return 'Con solo lectura no podés invitar. Pedile a quien organiza que te cambie el rol.'
    case 'email-invalido':
      return 'Revisá el mail: tiene que ser como nombre@mail.com.'
    default:
      return 'No pudimos enviar la invitación. Revisá la conexión e intentá de nuevo.'
  }
}

function InvitarPorMail({ viajeId }: { viajeId: string }) {
  const invitar = useInvitarPorMail(viajeId)
  const [mail, setMail] = useState('')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setError('Revisá el mail: tiene que ser como nombre@mail.com.')
      return
    }
    setError(undefined)
    invitar.mutate(mail, { onSuccess: () => setMail('') })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 md:flex-row md:items-end">
      <TextField label="Invitar por mail" type="email" autoComplete="email" value={mail} error={error} onChange={(evento) => setMail(evento.target.value)} className="flex-1" />
      <Button type="submit" variant="secundario" disabled={invitar.isPending}>
        Invitar
      </Button>
      {invitar.isSuccess && (
        <p role="status" className="text-meta font-bold text-positivo">
          Listo, le mandamos la invitación.
        </p>
      )}
      {invitar.isError && <p role="alert" className="text-meta font-semibold text-negativo">{mensajeErrorInvitacion(invitar.error)}</p>}
    </form>
  )
}

/** Grupo (editar viaje): destinos y fechas, quiénes van, invitar, movimientos y repetir el viaje. Se abre desde los avatares y desde "Editar viaje" del encabezado. */
export function Grupo() {
  const navigate = useNavigate()
  const { viaje, etapa } = useViajeActual()
  const invitacion = useInvitacionGrupo(viaje.id)
  const movimientos = useMovimientos(viaje.id)
  const repetir = useRepetirViaje(viaje.id)
  const cambiarRol = useCambiarRol(viaje.id)
  const puedeAdministrarRoles = esOrganizador(viaje.personas)
  const [aSacar, setASacar] = useState<Persona | null>(null)

  function repetirViaje(modo: 'mismas-personas' | 'mismo-destino') {
    repetir.mutate(modo, { onSuccess: (nuevo) => navigate(`/viajes/${nuevo.id}`) })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-7">
      <Tarjeta className="lg:col-span-2">
        <DestinosYFechas viaje={viaje} soloLectura={etapa === 'post' || !puedeEditar(viaje.personas)} />
      </Tarjeta>

      <div className="relative">
        <div className="flex flex-col gap-8 lg:absolute lg:inset-0 lg:gap-7">
          <Tarjeta titulo="Quiénes van" className="lg:min-h-0 lg:flex-1">
            <ul tabIndex={0} aria-label="Quiénes van" className={LISTA_CON_SCROLL}>
              {viaje.personas.map((persona) => (
                <li key={persona.id} className="flex items-center gap-3 border-b border-linea py-3 last:border-b-0">
                  <AvatarStack people={[{ name: persona.nombre, pinz: persona.pinz }]} max={1} />
                  <span className="flex flex-1 flex-col">
                    <span className="font-bold">{persona.esVos ? `${persona.nombre} (vos)` : persona.nombre}</span>
                    <span className="text-meta text-tinta-suave">
                      {persona.pinz ? `${ELENCO[persona.pinz].nombre}, ${ELENCO[persona.pinz].apodo}` : 'Todavía no eligió su pinz'}
                    </span>
                  </span>
                  {puedeAdministrarRoles && !persona.esVos ? (
                    <label>
                      <span className="sr-only">Rol de {persona.nombre}</span>
                      <select
                        value={persona.rol}
                        disabled={cambiarRol.isPending}
                        onChange={(evento) => {
                          const rol = RolSchema.safeParse(evento.target.value)
                          if (rol.success) cambiarRol.mutate({ personaId: persona.id, rol: rol.data })
                        }}
                        className="min-h-toque rounded-full trazo-fino bg-papel-hundido px-3 text-meta font-extrabold"
                      >
                        {RolSchema.options.map((rol) => (
                          <option key={rol} value={rol}>
                            {ROLES[rol]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="rounded-full trazo-fino bg-papel-hundido px-2.5 py-0.5 text-meta font-extrabold">{ROLES[persona.rol]}</span>
                  )}
                  {puedeAdministrarRoles && !persona.esVos && (
                    <Button
                      variant="fantasma"
                      size="icono"
                      icon={UserMinus}
                      aria-label={`Sacar a ${persona.nombre} del viaje`}
                      aria-haspopup="dialog"
                      title="Sacar del viaje"
                      onClick={() => setASacar(persona)}
                    />
                  )}
                </li>
              ))}
            </ul>
            {cambiarRol.isError && <p role="alert" className="mt-3 text-meta font-semibold text-negativo">No pudimos cambiar el rol. Revisá que siga habiendo al menos una persona organizadora.</p>}
            {puedeAdministrarRoles && (
              <SacarDelViaje viajeId={viaje.id} nombreViaje={viaje.nombre} persona={aSacar} onCerrar={() => setASacar(null)} />
            )}
          </Tarjeta>

          <Tarjeta titulo="Últimos movimientos" className="lg:min-h-0 lg:flex-1">
            {movimientos.isPending && <p className="text-tinta-suave">Cargando…</p>}
            {movimientos.error && <p className="text-negativo">No pudimos cargar los movimientos.</p>}
            <ul tabIndex={0} aria-label="Últimos movimientos" className={`gap-2 ${LISTA_CON_SCROLL}`}>
              {movimientos.data?.map((movimiento) => (
                <li key={movimiento.id} className="flex justify-between gap-3">
                  <span>{movimiento.texto}</span>
                  <span className="text-meta whitespace-nowrap text-tinta-suave">{cuandoEnDias(movimiento.cuando)}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:gap-7">
        <Tarjeta titulo="Invitar al grupo" fondo="bg-sol-tinte">
          {invitacion.isPending && <Cargando />}
          {invitacion.error && <NoCargo error={invitacion.error} onReintentar={() => invitacion.refetch()} />}
          {invitacion.data && (
            <>
              <div className="flex justify-center py-1">
                <QrSlot valor={invitacion.data.link} className="max-w-72" />
              </div>
              <p className="flex flex-col">
                <span className="text-sobretitulo uppercase">Código</span>
                <span className="font-display text-display font-black tracking-widest">{invitacion.data.codigo}</span>
              </p>
              <CompartirInvitacion link={invitacion.data.link} codigo={invitacion.data.codigo} viaje={viaje} />
            </>
          )}
          <InvitarPorMail viajeId={viaje.id} />
        </Tarjeta>

        <Tarjeta titulo="Repetir el viaje">
          <p className="text-tinta-suave">Arranca un viaje nuevo en Previaje, sin empezar de cero.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secundario" size="sm" disabled={repetir.isPending} onClick={() => repetirViaje('mismas-personas')}>
              Mismas personas
            </Button>
            <Button variant="secundario" size="sm" disabled={repetir.isPending} onClick={() => repetirViaje('mismo-destino')}>
              Mismo destino
            </Button>
          </div>
          {repetir.isError && <p role="alert" className="text-negativo">No pudimos crear el nuevo viaje. Probá de nuevo.</p>}
        </Tarjeta>
      </div>
    </div>
  )
}
