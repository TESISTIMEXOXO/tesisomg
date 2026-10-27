import { Pin } from '../../components/marca/Pin'
import { BalanceRow } from '../../components/ui/BalanceRow'
import { ButtonLink } from '../../components/ui/Button'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { PollOption } from '../../components/ui/PollOption'
import { inclinado } from './movimiento'

/** El mapa con el grupo de pinz llegando a Bariloche. En mobile van tres pinz y la tarjeta del saldo. */
function MapaDelGrupo() {
  return (
    <div className="relative h-90 w-full max-w-145 lg:h-135">
      <div className="absolute inset-0 bottom-10 overflow-hidden rounded-lg trazo-grueso bg-cielo-tinte shadow-grande">
        <svg width="100%" height="100%" viewBox="0 0 560 470" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M-20 360 C 80 330, 140 380, 230 350 S 400 300, 600 340 L 600 500 L -20 500 Z" strokeWidth="3" className="fill-cielo stroke-tinta" />
          <path d="M300 120 L 360 50 L 400 96 L 450 60 L 520 130 L 300 130 Z" strokeWidth="3" strokeLinejoin="round" className="fill-papel-elevado stroke-tinta" />
          <path d="M40 300 C 120 220, 200 280, 270 220 S 380 170, 430 150" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 14" className="stroke-tinta" />
          <path d="M90 420 C 160 360, 260 380, 300 300 S 400 200, 430 160" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 14" className="stroke-tinta" />
          <circle cx="440" cy="150" r="16" strokeWidth="3.5" className="fill-coral stroke-tinta" />
        </svg>
        <span className="absolute top-3/8 left-3/5 rounded-full trazo-fino bg-papel-elevado px-3 py-0.5 text-meta font-extrabold shadow-chica">
          Bariloche
        </span>
        <span className="absolute top-2/5 left-0 origin-top-left scale-75 motion-safe:animate-bob lg:scale-100" style={inclinado(-8)}>
          <Pin pinz="chispa" size={112} />
        </span>
        <span className="absolute top-1/5 left-1/3 origin-top-left scale-75 motion-safe:animate-bob lg:top-1/4 lg:scale-100" style={inclinado(6, -1)}>
          <Pin pinz="brujula" size={96} />
        </span>
        <span className="absolute top-1/2 left-1/2 origin-top-left scale-75 motion-safe:animate-bob lg:top-3/5 lg:left-1/6 lg:scale-100" style={inclinado(-4, -2)}>
          <Pin pinz="siesta" size={96} />
        </span>
        <span className="absolute top-2/5 left-9/20 hidden motion-safe:animate-bob lg:block" style={inclinado(8, -2.6)}>
          <Pin pinz="vuelto" size={78} />
        </span>
      </div>
      <div
        className="absolute -top-4.5 -right-2 hidden w-72.5 flex-col gap-2 rounded-lg trazo bg-papel-elevado p-3.5 shadow-grande motion-safe:animate-bob lg:flex"
        style={inclinado(3, -1.4)}
      >
        <p className="font-display text-titulo-2 font-black">¿Dónde dormimos?</p>
        <PollOption label="Cabaña Los Coihues" detail="3 de 6 votos" votes={3} total={6} disabled />
      </div>
      <div className="absolute inset-x-3 bottom-0 motion-safe:animate-bob lg:right-auto lg:-left-6 lg:w-82.5" style={inclinado(-3, -0.6)}>
        <BalanceRow name="Fede" pinz="brujula" amount={-12400} />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="bg-sol">
      <div className="mx-auto flex max-w-310 flex-col items-center gap-10 px-4 pt-10 pb-16 md:px-6 lg:flex-row lg:pt-16 lg:pb-20">
        <div className="flex min-w-0 flex-1 flex-col gap-6.5 motion-safe:animate-sube">
          <span className="self-start rounded-full trazo-fino bg-papel-elevado px-3.5 py-1.5 text-sobretitulo uppercase shadow-chica">
            Viajes en grupo, sin el lío
          </span>
          <h1 className="font-display text-display font-black md:text-display-xl">
            Viajen juntos.
            <br />
            Organícenlo fácil.
          </h1>
          <p className="max-w-130 text-cuerpo-lg font-semibold">
            Planes, votaciones, gastos y papeles del viaje, en un solo lugar. Cada uno es un pinz y el grupo llega junto.
          </p>
          <div className="flex flex-col gap-3.5 md:flex-row">
            <ButtonLink to="/ingresar">Armar un viaje</ButtonLink>
            <a href="#como" className={estilosBoton('secundario')}>
              Ver cómo funciona
            </a>
          </div>
        </div>
        <MapaDelGrupo />
      </div>
    </section>
  )
}
