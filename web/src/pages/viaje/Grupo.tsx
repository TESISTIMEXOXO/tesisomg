import { Copy, LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { QrSlot } from '../../components/slots/QrSlot'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useInvitacionGrupo, useInvitarPorMail, useMovimientos, useRepetirViaje, useSalirDelGrupo } from '../../hooks/grupo'
import { useViajeActual } from '../../layouts/contextoViaje'
import { ELENCO } from '../../pinz/elenco'
import type { Rol } from '../../types/persona'

const ROLES: Record<Rol, string> = { organizador: 'Organiza', miembro: 'Miembro', lector: 'Solo mira' }

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
    </form>
  )
}

/** Grupo: quiénes van, invitar, movimientos, repetir el viaje o salir. Se abre desde los avatares del encabezado. */
export function Grupo() {
  const { viaje } = useViajeActual()
  const invitacion = useInvitacionGrupo(viaje.id)
  const movimientos = useMovimientos(viaje.id)
  const salir = useSalirDelGrupo(viaje.id)
  const repetir = useRepetirViaje(viaje.id)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiarLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-7">
      <div className="flex flex-col gap-8 lg:gap-7">
        <Tarjeta titulo="Quiénes van">
          <ul className="flex flex-col">
            {viaje.personas.map((persona) => (
              <li key={persona.id} className="flex items-center gap-3 border-b border-linea py-3 last:border-b-0">
                <AvatarStack people={[{ name: persona.nombre, pinz: persona.pinz }]} max={1} />
                <span className="flex flex-1 flex-col">
                  <span className="font-bold">{persona.esVos ? `${persona.nombre} (vos)` : persona.nombre}</span>
                  <span className="text-meta text-tinta-suave">
                    {persona.pinz ? `${ELENCO[persona.pinz].nombre}, ${ELENCO[persona.pinz].apodo}` : 'Todavía no eligió su pinz'}
                  </span>
                </span>
                <span className="rounded-full trazo-fino bg-papel-hundido px-2.5 py-0.5 text-meta font-extrabold">{ROLES[persona.rol]}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Últimos movimientos">
          {movimientos.isPending && <p className="text-tinta-suave">Cargando…</p>}
          {movimientos.error && <p className="text-negativo">No pudimos cargar los movimientos.</p>}
          <ul className="flex flex-col gap-2">
            {movimientos.data?.map((movimiento) => (
              <li key={movimiento.id} className="flex justify-between gap-3">
                <span>{movimiento.texto}</span>
                <span className="text-meta whitespace-nowrap text-tinta-suave">{movimiento.cuando}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <div className="flex flex-col gap-8 lg:gap-7">
        <Tarjeta titulo="Invitar al grupo" fondo="bg-sol-tinte">
          {invitacion.isPending && <Cargando />}
          {invitacion.error && <NoCargo error={invitacion.error} onReintentar={() => invitacion.refetch()} />}
          {invitacion.data && (
            <>
              <p className="flex flex-col">
                <span className="text-sobretitulo uppercase">Código</span>
                <span className="font-display text-display font-black tracking-widest">{invitacion.data.codigo}</span>
              </p>
              <Button variant="secundario" size="sm" icon={Copy} className="self-start" onClick={() => copiarLink(invitacion.data.link)}>
                {copiado ? 'Link copiado' : 'Copiar el link'}
              </Button>
              <QrSlot valor={invitacion.data.link} />
            </>
          )}
          <InvitarPorMail viajeId={viaje.id} />
        </Tarjeta>

        <Tarjeta titulo="Repetir el viaje">
          <p className="text-tinta-suave">Arranca un viaje nuevo en Previaje, sin empezar de cero.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secundario" size="sm" disabled={repetir.isPending} onClick={() => repetir.mutate('mismas-personas')}>
              Mismas personas
            </Button>
            <Button variant="secundario" size="sm" disabled={repetir.isPending} onClick={() => repetir.mutate('mismo-destino')}>
              Mismo destino
            </Button>
          </div>
        </Tarjeta>

        <section aria-label="Salir del grupo" className="flex flex-col gap-3">
          {confirmarSalida ? (
            <div role="alertdialog" aria-label="Confirmar salida" className="flex flex-col gap-3 rounded-lg trazo bg-coral-tinte p-5">
              <p className="font-bold">¿Salís de “{viaje.nombre}”? Si tenés plata o reservas pendientes, te las mostramos antes.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secundario" size="sm" disabled={salir.isPending} onClick={() => salir.mutate()}>
                  Sí, salir del grupo
                </Button>
                <Button variant="fantasma" size="sm" onClick={() => setConfirmarSalida(false)}>
                  Me quedo
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="fantasma" icon={LogOut} className="self-start" onClick={() => setConfirmarSalida(true)}>
              Salir del grupo
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}
