import { Chip } from '../../components/ui/Chip'
import { PollOption } from '../../components/ui/PollOption'
import { Etiqueta, Tarjeta } from '../../components/ui/Tarjeta'
import { useVotar } from '../../hooks/votaciones'
import { conMayuscula, enumerar } from '../../lib/texto'
import type { Persona } from '../../types/persona'
import type { Votacion } from '../../types/votacion'
import { nombreEnElGrupo } from './nombres'

type TarjetaVotacionProps = {
  votacion: Votacion
  personas: Persona[]
  /** Sin edición: votación de solo lectura (lectores, o el Plan como recuerdo en Post-viaje). */
  soloLectura?: boolean
}

/** Una votación del grupo. Cuando cierra, la ganadora queda como un Chip seleccionado. */
export function TarjetaVotacion({ votacion, personas, soloLectura = false }: TarjetaVotacionProps) {
  const votar = useVotar(votacion.viajeId)
  const faltan = votacion.faltan.map((id) => nombreEnElGrupo(personas, id)).filter((n): n is string => Boolean(n))
  const ganadora = votacion.opciones.find((o) => o.id === votacion.ganadoraId)

  if (votacion.estado === 'cerrada') {
    return (
      <Tarjeta titulo={votacion.pregunta} extra={<Etiqueta fondo="bg-papel-hundido">Cerrada</Etiqueta>}>
        {ganadora && (
          <Chip selected tone="previaje" className="self-start" disabled>
            {ganadora.nombre}
          </Chip>
        )}
      </Tarjeta>
    )
  }

  return (
    <Tarjeta titulo={votacion.pregunta} extra={votacion.cierre && <Etiqueta>{votacion.cierre}</Etiqueta>}>
      <ul className="flex flex-col gap-2">
        {votacion.opciones.map((opcion) => {
          const votantes = opcion.votantes.map((id) => nombreEnElGrupo(personas, id)).filter((n): n is string => Boolean(n))
          const detalle = [opcion.detalle, votantes.length > 0 ? conMayuscula(enumerar(votantes)) : null].filter(Boolean).join(' · ')
          return (
            <li key={opcion.id}>
              <PollOption
                label={opcion.nombre}
                detail={detalle || null}
                votes={opcion.votantes.length}
                total={personas.length}
                voted={votacion.votoPropio === opcion.id}
                disabled={soloLectura || votar.isPending}
                onVote={() => votar.mutate({ votacionId: votacion.id, opcionId: opcion.id })}
              />
            </li>
          )
        })}
      </ul>
      {faltan.length > 0 && <p className="font-bold text-tinta-suave">{conMayuscula(`faltan ${enumerar(faltan)}.`)}</p>}
      {votar.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos guardar tu voto. Revisá la conexión y probá de nuevo.
        </p>
      )}
    </Tarjeta>
  )
}
