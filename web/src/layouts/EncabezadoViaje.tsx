import { Link } from 'react-router-dom'
import { AvatarStack } from '../components/ui/AvatarStack'
import { ButtonLink } from '../components/ui/Button'
import { StageSwitch } from '../components/ui/StageSwitch'
import { ETAPAS } from '../lib/etapa'
import { diasHasta, rangoDeFechas } from '../lib/fechas'
import { FONDO_DESTACADO } from '../pinz/tonos'
import type { Etapa, Viaje } from '../types/viaje'

type EncabezadoViajeProps = {
  viaje: Viaje
  etapa: Etapa
  /** Solo en desarrollo: deja mirar otra etapa. En producción la etapa cambia sola con las fechas. */
  onCambiarEtapa: (etapa: Etapa) => void
}

/** Dónde estoy: el viaje, la etapa con su color y quiénes van. */
export function EncabezadoViaje({ viaje, etapa, onCambiarEtapa }: EncabezadoViajeProps) {
  const organiza = viaje.personas.find((p) => p.rol === 'organizador')
  const faltan = viaje.fechaIda ? diasHasta(viaje.fechaIda) : null
  const personas = viaje.personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))

  return (
    <header
      className={`-mx-4 flex flex-col gap-4 trazo-grueso-t trazo-grueso-b px-4 pt-4 pb-5 md:-mx-6 md:px-6 lg:mx-0 lg:rounded-lg lg:trazo-grueso lg:p-8 lg:shadow-grande ${FONDO_DESTACADO[ETAPAS[etapa].tono]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="self-start rounded-full trazo-fino bg-papel-elevado px-3 py-1 text-sobretitulo uppercase">
            {ETAPAS[etapa].nombre} · {rangoDeFechas(viaje.fechaIda, viaje.fechaVuelta)}
          </span>
          <h1 className="font-display text-titulo-1 font-black lg:text-display">{viaje.nombre}</h1>
          <Link
            to={`/viajes/${viaje.id}/grupo`}
            className="flex min-h-toque items-center gap-3 self-start rounded-sm"
            aria-label={`Ver el grupo: ${viaje.personas.length} personas`}
          >
            <AvatarStack people={personas} max={6} />
            <span className="text-etiqueta font-bold">
              {viaje.personas.length} en el grupo{organiza && ` · organiza ${organiza.nombre}`}
            </span>
          </Link>
        </div>
        {etapa === 'previaje' && faltan !== null && faltan > 0 && (
          <p className="hidden flex-col items-center rounded-lg trazo-grueso bg-papel-elevado px-5.5 py-3.5 shadow-dura md:flex">
            <span className="font-display text-display font-black numeros">{faltan}</span>
            <span className="text-etiqueta">{faltan === 1 ? 'día para salir' : 'días para salir'}</span>
          </p>
        )}
        {etapa === 'viaje' && (
          <ButtonLink to={`/viajes/${viaje.id}/emergencias`} variant="emergencia" size="sm">
            Emergencias
          </ButtonLink>
        )}
      </div>
      {import.meta.env.DEV && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sobretitulo uppercase">Solo en desarrollo · ver otra etapa</span>
          <StageSwitch value={etapa} onChange={onCambiarEtapa} />
        </div>
      )}
    </header>
  )
}
