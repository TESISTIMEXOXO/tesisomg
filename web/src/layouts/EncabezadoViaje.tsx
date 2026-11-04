import { Eye, EyeOff, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarStack } from '../components/ui/AvatarStack'
import { ButtonLink } from '../components/ui/Button'
import { StageSwitch } from '../components/ui/StageSwitch'
import { ETAPAS } from '../lib/etapa'
import { diasHasta, rangoDeFechas } from '../lib/fechas'
import { FONDO_DESTACADO } from '../pinz/tonos'
import type { Etapa, Viaje } from '../types/viaje'
import { puedeEditar } from '../pages/viaje/nombres'

type EncabezadoViajeProps = {
  viaje: Viaje
  etapa: Etapa
  /** Solo en desarrollo: deja mirar otra etapa. En producción la etapa cambia sola con las fechas. */
  onCambiarEtapa: (etapa: Etapa) => void
}

/* Pensados para el encabezado de desktop (1120 × 300), con una separación pareja entre tramos. En mobile se ve el de la izquierda. */
const TRAMOS = [
  'M170 -20C165 20 120 35 -20 30',
  'M450 -20C430 50 340 90 230 105S50 130 -20 190',
  'M-20 270C40 245 110 250 150 320',
  'M250 320C280 270 300 220 360 190S480 170 540 210S680 240 740 320',
  'M555 -20C530 30 515 80 560 105S670 130 730 110S790 50 775 -20',
  'M870 -20C900 60 880 150 840 200S800 280 830 320',
  'M1000 -20C1000 70 1060 110 1140 120',
  'M940 320C960 240 1040 205 1140 200',
]

/** Caminos como los de la landing, en el tono de la etapa apenas oscurecido, detrás del contenido. */
function Caminos() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1120 300"
      preserveAspectRatio="xMinYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
    >
      {TRAMOS.map((d) => (
        <path key={d} d={d} fill="none" strokeWidth={20} strokeLinecap="round" className="stroke-tinta/8" />
      ))}
    </svg>
  )
}

/** Dónde estoy: el viaje, la etapa con su color y quiénes van. */
export function EncabezadoViaje({ viaje, etapa, onCambiarEtapa }: EncabezadoViajeProps) {
  const [verComoPublico, setVerComoPublico] = useState(false)
  const organiza = viaje.personas.find((p) => p.rol === 'organizador')
  /* Lleva a Grupo: invitación, QR, roles y movimientos del viaje. */
  const editable = puedeEditar(viaje.personas)
  const faltan = viaje.fechaIda ? diasHasta(viaje.fechaIda) : null
  const personas = viaje.personas.map((p) => ({ name: p.nombre, pinz: p.pinz }))

  return (
    <header
      className={`relative isolate -mx-4 flex flex-col overflow-hidden gap-4 trazo-grueso-t trazo-grueso-b px-4 pt-4 pb-5 md:-mx-6 md:px-6 lg:mx-0 lg:rounded-lg lg:trazo-grueso lg:p-8 lg:shadow-grande ${FONDO_DESTACADO[ETAPAS[etapa].tono]}`}
    >
      <Caminos />
      <div className="flex items-start justify-between gap-4">
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
        <div className="flex flex-none flex-col items-end gap-4">
          {editable && (
            <ButtonLink to={`/viajes/${viaje.id}/grupo`} variant="secundario" size="sm" icon={Pencil}>
              <span className="max-md:sr-only">Editar viaje</span>
            </ButtonLink>
          )}
          {etapa === 'previaje' && faltan !== null && faltan > 0 && (
            <p className="hidden flex-col items-center rounded-lg trazo-grueso bg-papel-elevado px-5.5 py-3.5 shadow-dura md:flex">
              <span className="font-display text-display font-black numeros">{faltan}</span>
              <span className="text-etiqueta">{faltan === 1 ? 'día para salir' : 'días para salir'}</span>
            </p>
          )}
        </div>
      </div>
      {/* Ocultarlo sirve para ver el encabezado como en producción. El botón queda siempre en el mismo lugar. */}
      {import.meta.env.DEV && (
        <div className={`flex items-end justify-between gap-2 ${verComoPublico ? '-my-3' : ''}`}>
          {!verComoPublico && (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sobretitulo uppercase">Solo en desarrollo · ver otra etapa</span>
              <StageSwitch value={etapa} onChange={onCambiarEtapa} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setVerComoPublico((actual) => !actual)}
            aria-pressed={verComoPublico}
            aria-label={verComoPublico ? 'Mostrar el selector de etapa' : 'Ocultar el selector de etapa'}
            title={verComoPublico ? 'Mostrar el selector de etapa' : 'Ocultar el selector de etapa'}
            className={`ml-auto grid size-11 flex-none place-items-center rounded-full hover:opacity-100 focus-visible:opacity-100 ${verComoPublico ? 'opacity-25' : 'opacity-40'}`}
          >
            {verComoPublico ? <Eye size={16} strokeWidth={2} aria-hidden /> : <EyeOff size={16} strokeWidth={2} aria-hidden />}
          </button>
        </div>
      )}
    </header>
  )
}
