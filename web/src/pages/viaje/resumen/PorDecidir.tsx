import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Etiqueta, Tarjeta } from '../../../components/ui/Tarjeta'
import { conMayuscula, enumerar } from '../../../lib/texto'
import type { Persona } from '../../../types/persona'
import type { Votacion } from '../../../types/votacion'
import { nombreEnElGrupo } from '../nombres'
import { TarjetaVotacion } from '../TarjetaVotacion'

type PorDecidirProps = {
  viajeId: string
  votaciones: Votacion[]
  personas: Persona[]
  soloLectura: boolean
}

/**
 * Las votaciones abiertas del resumen. Las que te faltan van completas, para votar ahí mismo;
 * las que ya votaste quedan en una lista corta, así el resumen no se llena de tarjetas que no te piden nada.
 */
export function PorDecidir({ viajeId, votaciones, personas, soloLectura }: PorDecidirProps) {
  const abiertas = votaciones.filter((votacion) => votacion.estado === 'abierta')
  const teFaltan = abiertas.filter((votacion) => votacion.votoPropio === null)
  const yaVotaste = abiertas.filter((votacion) => votacion.votoPropio !== null)

  if (abiertas.length === 0) {
    return (
      <Tarjeta titulo="Por decidir">
        <p className="text-tinta-suave">No hay votaciones abiertas. Proponé algo desde Listas.</p>
      </Tarjeta>
    )
  }

  return (
    <>
      {teFaltan.map((votacion) => (
        <TarjetaVotacion key={votacion.id} votacion={votacion} personas={personas} soloLectura={soloLectura} />
      ))}
      {yaVotaste.length > 0 && (
        <Tarjeta titulo={teFaltan.length > 0 ? 'También abiertas' : 'Por decidir'}>
          <ul className="flex flex-col">
            {yaVotaste.map((votacion) => {
              const faltan = votacion.faltan.map((id) => nombreEnElGrupo(personas, id)).filter((n): n is string => Boolean(n))
              return (
                <li key={votacion.id} className="flex items-start gap-3 border-b border-linea py-3 first:pt-0 last:border-b-0 last:pb-0">
                  <Check size={20} strokeWidth={2} aria-hidden className="mt-0.5 flex-none text-positivo" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="font-bold">{votacion.pregunta}</p>
                    <p className="text-meta text-tinta-suave">
                      Ya votaste. {faltan.length > 0 ? conMayuscula(`faltan ${enumerar(faltan)}.`) : 'Votaron todos.'}
                    </p>
                  </div>
                  {votacion.cierre && <Etiqueta>{votacion.cierre}</Etiqueta>}
                </li>
              )
            })}
          </ul>
          <Link to={`/viajes/${viajeId}/listas`} className="self-start rounded-sm font-extrabold underline decoration-2 underline-offset-4">
            Ver las votaciones
          </Link>
        </Tarjeta>
      )}
    </>
  )
}
