import type { ReactNode } from 'react'
import { Pin } from '../../components/marca/Pin'
import { Seccion } from './Seccion'
import { inclinado } from './movimiento'

function Etiqueta({ fondo, children }: { fondo: string; children: ReactNode }) {
  return (
    <span className={`relative mx-1 inline-block rounded-full trazo px-6 pt-1 pb-2 align-middle text-frase-etiqueta whitespace-nowrap shadow-dura ${fondo}`}>
      {children}
    </span>
  )
}

/* El camino no pasa por esta altura de la página: este pinz es el que se mueve mientras se lee la frase. */
export function ParaQuienes() {
  return (
    <Seccion className="pt-17.5 pb-5 text-center lg:py-15">
      <p className="mx-auto max-w-295 font-display text-frase text-balance">
        Para viajar <Etiqueta fondo="bg-sol -rotate-3">con amigos</Etiqueta> o <Etiqueta fondo="bg-mar rotate-2">en familia</Etiqueta>, de{' '}
        <Etiqueta fondo="bg-lavanda rotate-3">
          mochileros
          <span aria-hidden className="absolute -top-9 -right-3 motion-safe:animate-bob lg:-top-13 lg:-right-5" style={inclinado(10)}>
            <Pin pinz="cumbre" size={72} label="" className="max-lg:size-12" />
          </span>
        </Etiqueta>
        , a un <Etiqueta fondo="bg-coral -rotate-2">finde largo</Etiqueta> o a una <Etiqueta fondo="bg-cielo rotate-2">despedida</Etiqueta>.
      </p>
    </Seccion>
  )
}
