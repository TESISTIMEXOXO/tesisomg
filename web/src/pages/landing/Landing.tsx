import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Camino } from '../../components/landing/Camino'
import { useSoloClaro } from '../../hooks/tema'
import { BarraLanding } from './BarraLanding'
import { CintaDestinos } from './CintaDestinos'
import { Cierre } from './Cierre'
import { ElegiTuPinz } from './ElegiTuPinz'
import { ElProblema } from './ElProblema'
import { Funciones } from './Funciones'
import { Hero } from './Hero'
import { ParaQuienes } from './ParaQuienes'
import { Pie } from './Pie'
import { Preguntas } from './Preguntas'
import { Pausa } from './Seccion'
import { TresEtapas } from './TresEtapas'

/**
 * La página pública. Acá los pinz son protagonistas y todo lleva a "Armar un viaje".
 * El fondo es papel de punta a punta: las secciones las separan las pausas por donde cruza el camino.
 * overflow-clip esconde las vueltas del camino por fuera de pantalla.
 */
export function Landing() {
  useSoloClaro()
  /* En estado y no en un ref: así el camino se mide antes del primer cuadro y aparece junto con el texto. */
  const [landing, setLanding] = useState<HTMLDivElement | null>(null)

  return (
    <div ref={setLanding} className="relative overflow-clip bg-papel">
      <Outlet />
      <Camino contenedor={landing} />
      <BarraLanding />
      <main>
        <Hero />
        <CintaDestinos />
        <ElProblema />
        <Pausa ancla="banda1" />
        <Funciones />
        <Pausa ancla="banda2" />
        <TresEtapas />
        <Pausa ancla="banda3" className="h-42.5 lg:h-65" />
        <ElegiTuPinz />
        <Pausa ancla="banda4" className="hidden lg:block lg:h-60" />
        <ParaQuienes />
        <Preguntas />
        <Pausa ancla="banda5" />
        <Cierre />
      </main>
      <Pie />
    </div>
  )
}
