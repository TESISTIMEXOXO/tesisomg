import { Pin } from '../../components/marca/Pin'
import type { PinzId } from '../../pinz/elenco'
import { Banda, Sobretitulo, TituloBanda } from './Banda'
import { inclinado } from './movimiento'

const ETAPAS: { momento: string; titulo: string; texto: string; fondo: string; pinz: PinzId; grados: number }[] = [
  {
    momento: 'Antes · Previaje',
    titulo: 'Decidan sin perder el hilo.',
    texto: 'Voten destino, fechas y alojamiento. Cada tarea tiene un responsable y el checklist muestra qué falta.',
    fondo: 'bg-sol',
    pinz: 'chispa',
    grados: 6,
  },
  {
    momento: 'Durante · Viaje',
    titulo: 'El día, en el mapa.',
    texto: 'Qué hacen hoy, dónde está cada pinz del grupo, el voucher a mano y los gastos cargados al toque.',
    fondo: 'bg-mar',
    pinz: 'nono',
    grados: -6,
  },
  {
    momento: 'Después · Post-viaje',
    titulo: 'Cuentas claras, amistades largas.',
    texto: 'Pinz calcula quién le pasa plata a quién con la menor cantidad de transferencias. Y después, a repetir.',
    fondo: 'bg-lavanda',
    pinz: 'postal',
    grados: 4,
  },
]

export function TresEtapas() {
  return (
    <Banda fondo="bg-papel-hundido" className="flex flex-col gap-11">
      <div className="flex max-w-190 flex-col gap-3">
        <Sobretitulo>Un viaje, tres momentos</Sobretitulo>
        <TituloBanda>Pinz cambia con el viaje.</TituloBanda>
      </div>
      <ol className="flex flex-col gap-24 pt-8 lg:flex-row lg:gap-7">
        {ETAPAS.map((etapa, i) => (
          <li key={etapa.pinz} className={`relative flex flex-1 flex-col gap-3.5 rounded-lg trazo-grueso p-7 shadow-grande ${etapa.fondo}`}>
            <span className="absolute -top-19.5 right-4.5 motion-safe:animate-jump" style={inclinado(etapa.grados, -0.9 * i)}>
              <Pin pinz={etapa.pinz} size={106} label="" />
            </span>
            <span className="self-start rounded-full trazo-fino bg-papel-elevado px-3 py-1 text-sobretitulo uppercase">{etapa.momento}</span>
            <h3 className="font-display text-titulo-1 font-black">{etapa.titulo}</h3>
            <p className="text-cuerpo-lg font-semibold">{etapa.texto}</p>
          </li>
        ))}
      </ol>
    </Banda>
  )
}
