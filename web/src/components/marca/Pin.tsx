import { createElement, useId, type ReactNode } from 'react'
import { CARA_GENERICA, DIBUJOS, SILUETA, VIEWBOX_PINZ, type Pintura, type Trazo } from '../../pinz/dibujos'
import { ELENCO, type PinzId, type TonoPinz } from '../../pinz/elenco'

export type PinProps = {
  pinz?: PinzId | 'generico'
  /** Solo para el genérico: el tono del pin. */
  color?: TonoPinz
  /** Lado de la caja en px, accesorios incluidos. */
  size?: number
  /** Texto accesible. Los personajes usan su nombre; con label="" el pin es decorativo. */
  label?: string
  className?: string
}

/*
 * Los colores de la paleta se pintan con sus variables, así siguen a los tokens.
 * Los que cambian con el tema se leen crudos: así el .tema-claro del dibujo los devuelve a la paleta clara.
 */
const DEL_TEMA = /^(tinta|papel|linea|contorno)|-tinte$/

function pintar(color: string) {
  if (color === 'none' || color.startsWith('#')) return color
  return DEL_TEMA.test(color) ? `var(--${color})` : `var(--color-${color})`
}

function dibujar(trazos: Trazo[], prefijo: string): ReactNode[] {
  return trazos.map((trazo, i) => {
    const atributos = Object.fromEntries(
      Object.entries(trazo.atributos).map(([clave, valor]) =>
        (clave === 'fill' || clave === 'stroke') && typeof valor === 'string' ? [clave, pintar(valor)] : [clave, valor],
      ),
    )
    const key = `${prefijo}-${i}`
    return createElement(trazo.etiqueta, { key, ...atributos }, trazo.hijos && dibujar(trazo.hijos, key))
  })
}

function Silueta({ relleno }: { relleno: Pintura }) {
  return (
    <>
      <path d={SILUETA} transform="translate(6 6)" fill={pintar('tinta')} stroke={pintar('tinta')} strokeWidth={6} strokeLinejoin="round" />
      <path d={SILUETA} fill={pintar(relleno)} stroke={pintar('tinta')} strokeWidth={6} strokeLinejoin="round" />
    </>
  )
}

/** El pinz genérico sin su <svg>, para meterlo dentro de otros dibujos (el logo, el ícono). Va dentro de un .tema-claro. */
export function FiguraGenerica({ color }: { color: TonoPinz }) {
  return (
    <>
      <Silueta relleno={color} />
      {dibujar(CARA_GENERICA, 'cara')}
    </>
  )
}

function Personaje({ pinz }: { pinz: PinzId }) {
  const recorte = useId()
  const dibujo = DIBUJOS[pinz]
  return (
    <>
      {dibujar(dibujo.detras, 'detras')}
      <Silueta relleno={ELENCO[pinz].tono} />
      {dibujo.recortado && (
        <>
          <clipPath id={recorte}>
            <path d={SILUETA} />
          </clipPath>
          <g clipPath={`url(#${recorte})`}>{dibujar(dibujo.recortado, 'recortado')}</g>
          <path d={SILUETA} fill="none" stroke={pintar('tinta')} strokeWidth={6} strokeLinejoin="round" />
        </>
      )}
      {dibujar(dibujo.delante, 'delante')}
    </>
  )
}

export function Pin({ pinz = 'generico', color = 'coral', size = 64, label, className = '' }: PinProps) {
  const nombre = label === '' ? undefined : (label ?? (pinz === 'generico' ? undefined : ELENCO[pinz].nombre))
  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX_PINZ}
      className={`tema-claro block flex-none overflow-visible ${className}`}
      role={nombre ? 'img' : undefined}
      aria-label={nombre}
      aria-hidden={nombre ? undefined : true}
    >
      {pinz === 'generico' ? <FiguraGenerica color={color} /> : <Personaje pinz={pinz} />}
    </svg>
  )
}
