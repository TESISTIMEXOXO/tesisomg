import type { ReactNode } from 'react'
import { Seccion } from './Seccion'

function Etiqueta({ fondo, children }: { fondo: string; children: ReactNode }) {
  return (
    <span className={`mx-1 inline-block rounded-full trazo px-6 pt-1 pb-2 align-middle text-frase-etiqueta whitespace-nowrap shadow-dura ${fondo}`}>
      {children}
    </span>
  )
}

export function ParaQuienes() {
  return (
    <Seccion className="pt-17.5 pb-5 text-center lg:py-15">
      <p className="mx-auto max-w-295 font-display text-frase text-balance">
        Para viajar <Etiqueta fondo="bg-sol -rotate-3">con amigos</Etiqueta> o <Etiqueta fondo="bg-mar rotate-2">en familia</Etiqueta>, de{' '}
        <Etiqueta fondo="bg-lavanda rotate-3">mochileros</Etiqueta>, a un <Etiqueta fondo="bg-coral -rotate-2">finde largo</Etiqueta> o a una{' '}
        <Etiqueta fondo="bg-cielo rotate-2">despedida</Etiqueta>.
      </p>
    </Seccion>
  )
}
