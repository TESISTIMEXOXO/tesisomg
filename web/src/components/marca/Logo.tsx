import { FiguraGenerica, Pin } from './Pin'

type LogoProps = {
  /** marca = el pin y "pinz" a su derecha; simbolo = el pin solo; icono = ícono de app. */
  variant?: 'marca' | 'simbolo' | 'icono'
  /** Alto en px. */
  size?: number
  /** Color de las letras: tinta, o blanco sobre fondos oscuros. */
  ink?: 'tinta' | 'blanco'
  /** Color del pin de la i. Dentro de la app puede tomar el tono del pinz del usuario. */
  color?: 'coral' | 'sol' | 'mar' | 'lavanda' | 'cielo'
  label?: string
  className?: string
}

/* La palabra "pinz" en Archivo 900, en curvas: no depende de que cargue la fuente. */
const LETRAS = [
  {
    x: 0,
    d: 'M61 -197V528H223L240 453H247Q275 500 316.0 520.0Q357 540 408 540Q478 540 528.0 509.5Q578 479 604.5 417.5Q631 356 631 263Q631 171 604.5 110.0Q578 49 528.0 18.5Q478 -12 408 -12Q380 -12 353.5 -6.0Q327 0 305.0 13.5Q283 27 267 48H260V-197ZM346 135Q377 135 396.0 148.0Q415 161 423.5 184.0Q432 207 432 238V291Q432 322 423.5 345.0Q415 368 396.0 380.5Q377 393 346 393Q315 393 295.5 378.0Q276 363 267.0 337.5Q258 312 258 281V248Q258 225 263.0 204.5Q268 184 278.5 168.5Q289 153 306.0 144.0Q323 135 346 135Z',
  },
  { x: 122.4, d: 'M60 0V528H259V0ZM60 590V760H259V590Z' },
  {
    x: 175.2,
    d: 'M60 0V528H223L236 448H243Q264 479 292.0 499.5Q320 520 354.0 530.0Q388 540 424 540Q487 540 527.5 516.5Q568 493 588.0 449.0Q608 405 608 342V0H409V318Q409 335 404.5 348.5Q400 362 392.0 372.0Q384 382 371.5 387.5Q359 393 342 393Q317 393 298.5 381.5Q280 370 269.5 351.5Q259 333 259 310V0Z',
  },
  { x: 297.6, d: 'M20 0V65L242 393H32V528H526V466L302 135H535V0Z' },
]

/* El pin ocupa del punto de la i a la línea de base; las letras arrancan a su derecha. */
const PALABRA_X = 135
const MARCA_ANCHO = 549
const MARCA_ALTO = 202

export function Logo({ variant = 'marca', size = 48, ink = 'tinta', color = 'coral', label = 'pinz', className = '' }: LogoProps) {
  const accesible = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

  if (variant === 'simbolo') {
    return <Pin size={(size * 176) / 130} color={color} label={label} className={className} />
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

  return (
    <svg
      height={size}
      width={(size * MARCA_ANCHO) / MARCA_ALTO}
      viewBox={`-4 18 ${MARCA_ANCHO} ${MARCA_ALTO}`}
      {...accesible}
      className={`block flex-none overflow-visible ${className}`}
    >
      <g transform="translate(-20 14) scale(1.25)" className="tema-claro">
        <FiguraGenerica color={color} />
      </g>
      <g className={ink === 'blanco' ? 'fill-papel-elevado' : 'fill-tinta'}>
        {LETRAS.map((letra) => (
          <path key={letra.x} transform={`translate(${PALABRA_X + letra.x} 175.6) scale(0.2 -0.2)`} d={letra.d} />
        ))}
      </g>
    </svg>
  )
}
