import { FiguraGenerica, Pin } from './Pin'

type LogoProps = {
  /** marca = el pin y "pinz" a su derecha; simbolo = el pin solo; icono = ícono de app. */
  variant?: 'marca' | 'simbolo' | 'icono'
  /** En marca, el alto de la palabra en px; en simbolo e icono, el lado. */
  size?: number
  /** Color de las letras: tinta, o blanco sobre fondos oscuros. */
  ink?: 'tinta' | 'blanco'
  label?: string
  className?: string
}

export function Logo({ variant = 'marca', size = 40, ink = 'tinta', label = 'pinz', className = '' }: LogoProps) {
  const accesible = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

  if (variant === 'simbolo') {
    return <Pin size={size} label={label} className={className} />
  }

  if (variant === 'icono') {
    return (
      <svg width={size} height={size} viewBox="0 0 240 240" {...accesible} className={`tema-claro block flex-none ${className}`}>
        <rect x="10" y="10" width="220" height="220" rx="56" className="fill-tinta" />
        <rect x="4" y="4" width="220" height="220" rx="56" strokeWidth="6" className="fill-lavanda stroke-tinta" />
        <g transform="translate(26 74) rotate(-12 40 50) scale(.62)">
          <FiguraGenerica color="sol" />
        </g>
        <g transform="translate(130 70) rotate(10 40 50) scale(.62)">
          <FiguraGenerica color="mar" />
        </g>
        <g transform="translate(66 42) scale(.8)">
          <FiguraGenerica color="coral" />
        </g>
      </svg>
    )
  }

  /* El pin es más alto que la palabra: el margen negativo lo deja asomar sin agrandar la caja. */
  const margen = -size * 0.2
  return (
    <span {...accesible} className={`inline-flex flex-none items-center align-middle ${className}`} style={{ gap: Math.round(size * 0.06) }}>
      <span className="flex" style={{ margin: `${margen}px ${margen}px ${margen}px 0` }}>
        <Pin size={size * 1.25} label="" />
      </span>
      <span
        aria-hidden
        className={`font-display font-black tracking-marca ${ink === 'blanco' ? 'text-papel-elevado' : 'text-tinta'}`}
        style={{ fontSize: size * 1.05, lineHeight: 1 }}
      >
        pinz
      </span>
    </span>
  )
}
