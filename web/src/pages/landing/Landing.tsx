import { useSoloClaro } from '../../hooks/tema'
import { BarraLanding } from './BarraLanding'
import { CintaDestinos } from './CintaDestinos'
import { Cierre } from './Cierre'
import { ComoFunciona } from './ComoFunciona'
import { ElegiTuPinz } from './ElegiTuPinz'
import { ElProblema } from './ElProblema'
import { Funciones } from './Funciones'
import { Hero } from './Hero'
import { ParaQuienes } from './ParaQuienes'
import { Pie } from './Pie'
import { Preguntas } from './Preguntas'
import { TresEtapas } from './TresEtapas'

/** La página pública. Acá los pinz son protagonistas y todo lleva a "Armar un viaje". */
export function Landing() {
  useSoloClaro()
  return (
    <div className="overflow-x-clip">
      <BarraLanding />
      <main>
        <Hero />
        <CintaDestinos />
        <ElProblema />
        <TresEtapas />
        <Funciones />
        <ElegiTuPinz />
        <ComoFunciona />
        <ParaQuienes />
        <Preguntas />
        <Cierre />
      </main>
      <Pie />
    </div>
  )
}
