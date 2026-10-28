import { Logo } from '../../components/marca/Logo'

const LINKS = [
  { href: '#todo', label: 'Qué podés hacer' },
  { href: '#preguntas', label: 'Preguntas' },
]

export function Pie() {
  return (
    <footer className="relative z-10 px-4 pt-9 pb-11 md:px-6 lg:pt-14 lg:pb-16">
      <div className="mx-auto flex max-w-contenido flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Logo size={64} className="lg:hidden" />
        <Logo size={120} className="max-lg:hidden" />
        <nav aria-label="Pie" className="flex flex-wrap gap-4.5 text-etiqueta font-bold lg:gap-7 lg:text-cuerpo">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="rounded-sm underline underline-offset-4 hover:text-tinta-suave">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-meta font-bold lg:text-cuerpo">Hecho en Argentina</p>
      </div>
    </footer>
  )
}
