import { Pin } from '../../components/marca/Pin'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { BalanceRow } from '../../components/ui/BalanceRow'
import { ButtonLink } from '../../components/ui/Button'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { ItineraryItem } from '../../components/ui/ItineraryItem'
import { PollOption } from '../../components/ui/PollOption'
import type { PinzId } from '../../pinz/elenco'
import { inclinado } from './movimiento'

const GRUPO: { name: string; pinz: PinzId }[] = [
  { name: 'Nacho', pinz: 'vuelto' },
  { name: 'Fede', pinz: 'brujula' },
  { name: 'Santi', pinz: 'siesta' },
  { name: 'Juan Cruz', pinz: 'trasnoche' },
  { name: 'Pedro', pinz: 'morfi' },
  { name: 'Tomi', pinz: 'cumbre' },
]

/** La pantalla Hoy en un celular: el día, el grupo en el mapa y lo que toca ahora. */
function Celular() {
  return (
    <div className="h-125 w-62.5 rounded-xl trazo-grueso bg-tinta p-2.5 shadow-grande">
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-papel text-left">
        <div className="trazo-grueso-b bg-mar px-3.5 pt-5.5 pb-3">
          <p className="text-sobretitulo uppercase">Día 3 de 8</p>
          <p className="font-display text-titulo-2 font-black">Hoy, a la montaña.</p>
        </div>
        <div className="relative m-3 h-42.5 overflow-hidden rounded-md trazo bg-cielo-tinte">
          <svg width="100%" height="100%" viewBox="0 0 200 170" preserveAspectRatio="none" aria-hidden className="absolute inset-0">
            <path d="M-5 130 Q 60 110, 110 125 T 210 120 L 210 180 L -5 180 Z" strokeWidth="2.5" className="fill-cielo stroke-contorno" />
            <path d="M20 105 C 60 70, 100 110, 140 70 S 175 45, 185 40" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 9" className="stroke-contorno" />
          </svg>
          <span className="absolute top-2 left-25">
            <Pin pinz="nono" size={52} label="" />
          </span>
          <span className="absolute top-0 left-35">
            <Pin pinz="cumbre" size={54} label="" />
          </span>
          <span className="absolute top-12.5 left-7.5">
            <Pin pinz="trasnoche" size={46} label="" />
          </span>
        </div>
        <ol className="px-3">
          <ItineraryItem time="10:00" title="Subida al Cerro" place="Base del cerro" current last />
        </ol>
      </div>
    </div>
  )
}

/** Un viaje abierto en el navegador: el encabezado, una votación y las cuentas. */
function Navegador() {
  return (
    <div className="overflow-hidden rounded-lg trazo-grueso bg-papel-elevado shadow-grande">
      <div className="flex items-center gap-2 trazo-grueso-b bg-papel-hundido px-4 py-3">
        <span className="size-3.5 rounded-full trazo bg-coral" />
        <span className="size-3.5 rounded-full trazo bg-sol" />
        <span className="size-3.5 rounded-full trazo bg-mar" />
        <span className="ml-3.5 flex-1 rounded-full trazo-fino bg-papel-elevado px-3.5 py-0.5 text-meta font-bold text-tinta-suave">
          pinz.app/viajes/bariloche
        </span>
      </div>
      <div className="grid grid-cols-2 gap-5 p-5.5">
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-md trazo bg-sol-tinte px-5.5 py-4.5 text-left">
          <div className="flex flex-col items-start gap-2">
            <span className="rounded-full trazo bg-sol px-2.5 py-0.5 text-sobretitulo uppercase">Previaje · 14 – 21 ene</span>
            <p className="font-display text-display">Bariloche con los chicos</p>
          </div>
          <AvatarStack people={GRUPO} max={6} />
        </div>
        <div className="flex flex-col gap-2 barras-se-llenan">
          <p className="font-display text-titulo-2 font-black">¿Dónde dormimos?</p>
          <PollOption label="Cabaña Los Coihues" detail="$ 38.000 la noche" votes={3} total={6} disabled />
          <PollOption label="Hostel del Lago" detail="$ 22.000 la noche" votes={1} total={6} disabled />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-display text-titulo-2 font-black">Cuentas</p>
          <BalanceRow name="Fede" pinz="brujula" amount={-12400} />
          <BalanceRow name="Tomi" pinz="cumbre" amount={8150} />
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative z-10 px-4 pt-7.5 text-center md:px-6 lg:pt-17.5">
      <h1 className="mx-auto font-display text-portada lg:mt-10 lg:max-w-295 lg:text-portada-lg">
        Viajen juntos. <span className="text-coral contorno-texto">Organícenlo</span> fácil.
      </h1>
      <p className="mx-auto mt-5 max-w-160 text-cuerpo-lg font-semibold text-balance lg:mt-8.5 lg:text-bajada">
        Planes, votaciones, gastos y papeles del viaje, en un solo lugar. Cada uno es un pinz y el grupo llega junto.
      </p>
      <div className="mt-5.5 flex flex-col gap-2.5 md:flex-row md:justify-center md:gap-3.5 lg:mt-8">
        <ButtonLink to="/ingresar">Armar un viaje</ButtonLink>
        <a href="#etapas" className={estilosBoton('secundario')}>
          Ver cómo funciona
        </a>
      </div>

      <div className="relative mt-11 h-117.5 lg:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rotate-3">
          <Celular />
        </div>
      </div>
      <div className="relative mx-auto mt-20 hidden h-150 max-w-295 lg:block">
        <div className="absolute top-10 left-2.5 w-3/4 -rotate-2">
          <Navegador />
        </div>
        <div className="absolute top-0 -right-2.5 motion-safe:animate-bob" style={inclinado(5)}>
          <Celular />
        </div>
      </div>
    </section>
  )
}
