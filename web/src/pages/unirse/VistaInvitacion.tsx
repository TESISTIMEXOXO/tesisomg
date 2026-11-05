import { Calendar, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Cargando } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { useSesion } from '../../hooks/auth'
import { useInvitacion, useUnirse } from '../../hooks/viajes'
import { rangoDeFechas } from '../../lib/fechas'
import { estaBaneado } from '../../lib/expulsion'
import { olvidarInvitacion, recordarInvitacion } from '../../lib/invitacionPendiente'

/**
 * El link de una invitación. Sin sesión, primero hay que entrar o crear la cuenta (y completar el perfil,
 * para que el grupo vea un nombre): el código queda guardado y al terminar se vuelve acá.
 */
export function VistaInvitacion() {
  const { codigo = '' } = useParams()
  const { data: sesion, isPending, isError, refetch } = useSesion()

  if (isPending) return <Cargando />
  if (isError) {
    return (
      <PinzNote tipo="error" title="No pudimos conectarnos" action="Probar de nuevo" onAction={() => refetch()}>
        Revisá la conexión y volvé a intentar.
      </PinzNote>
    )
  }
  if (!sesion || !sesion.perfilCompleto) {
    recordarInvitacion(codigo)
    return <Navigate to={sesion ? '/bienvenida' : '/ingresar'} replace />
  }
  return <Invitacion codigo={codigo} />
}

/** Vista previa de la invitación: a qué viaje se entra antes de sumarse. */
function Invitacion({ codigo }: { codigo: string }) {
  const navigate = useNavigate()
  const { data: invitacion, isPending, error } = useInvitacion(codigo)
  const unirse = useUnirse()

  // Ya volvió a la invitación: no hace falta seguir recordándola.
  useEffect(olvidarInvitacion, [])

  if (isPending) return <Cargando />
  // Lo sacaron tres veces: el link guardado ya no le sirve, y ni siquiera ve el viaje.
  if (estaBaneado(error) || estaBaneado(unirse.error)) {
    return (
      <PinzNote tipo="error" title="No podés volver a este viaje" action="Ir a mis viajes" actionTo="/viajes">
        Te sacaron de este viaje tres veces, así que ya no podés sumarte de nuevo.
      </PinzNote>
    )
  }
  if (error) {
    return (
      <PinzNote tipo="error" title="No encontramos ese viaje" action="Probar con otro código" actionTo="/unirse">
        {error.message}
      </PinzNote>
    )
  }

  const { viaje } = invitacion
  const irAlViaje = () => navigate(`/viajes/${viaje.id}`)

  return (
    <div className="flex flex-col gap-6 pt-6">
      <p className="text-cuerpo-lg">
        <b>{invitacion.invitaNombre}</b> te sumó a
      </p>
      <Tarjeta fondo="bg-sol-tinte">
        <h1 className="font-display text-display font-black">{viaje.nombre}</h1>
        <p className="flex items-center gap-2 font-bold">
          <MapPin size={20} strokeWidth={2} aria-hidden />
          {viaje.destino}
        </p>
        <p className="flex items-center gap-2 font-bold">
          <Calendar size={20} strokeWidth={2} aria-hidden />
          {rangoDeFechas(viaje.fechaIda, viaje.fechaVuelta)}
        </p>
        <div className="flex items-center gap-3">
          <AvatarStack people={viaje.personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))} max={6} />
          <span className="text-etiqueta">Van {viaje.personas.map((p) => p.nombre).join(', ')}</span>
        </div>
      </Tarjeta>
      {invitacion.yaEsMiembro ? (
        <Button full onClick={irAlViaje}>
          Entrar al viaje
        </Button>
      ) : (
        <Button full disabled={unirse.isPending} onClick={() => unirse.mutate(codigo, { onSuccess: irAlViaje })}>
          {unirse.isPending ? 'Sumándote…' : 'Sumarme'}
        </Button>
      )}
      {unirse.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos sumarte al viaje. Revisá la conexión y probá de nuevo.
        </p>
      )}
    </div>
  )
}
