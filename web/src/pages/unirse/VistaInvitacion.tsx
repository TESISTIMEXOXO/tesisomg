import { Calendar, MapPin } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Cargando } from '../../components/marca/Estados'
import { PinzNote } from '../../components/marca/PinzNote'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { useInvitacion, useUnirse } from '../../hooks/viajes'
import { rangoDeFechas } from '../../lib/fechas'

/** Vista previa de la invitación: a qué viaje se entra antes de sumarse. */
export function VistaInvitacion() {
  const { codigo = '' } = useParams()
  const navigate = useNavigate()
  const { data: invitacion, isPending, error } = useInvitacion(codigo)
  const unirse = useUnirse()

  if (isPending) return <Cargando />
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
