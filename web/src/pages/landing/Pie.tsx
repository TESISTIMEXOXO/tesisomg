import { Logo } from '../../components/marca/Logo'

export function Pie() {
  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto flex max-w-310 flex-col gap-6 px-4 py-11 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-6">
        <Logo size={40} ink="blanco" />
        <nav aria-label="Pie" className="flex flex-wrap gap-6 text-etiqueta font-bold">
          <a href="#como" className="rounded-sm underline-offset-4 hover:underline">
            Cómo funciona
          </a>
          <a href="#preguntas" className="rounded-sm underline-offset-4 hover:underline">
            Preguntas
          </a>
        </nav>
        <p className="text-etiqueta font-semibold">Hecho en Argentina</p>
      </div>
    </footer>
  )
}
