import { Logo } from '../components/marca/Logo'
import { PinzNote } from '../components/marca/PinzNote'

export function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-120 flex-col items-center justify-center gap-4 px-4">
      <Logo size={30} />
      <PinzNote tipo="error" title="Esta página se perdió" action="Volver a Mis viajes" actionTo="/viajes">
        El link no existe o se movió.
      </PinzNote>
    </main>
  )
}
