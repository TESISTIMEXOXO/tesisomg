import { useEffect, useState, type CSSProperties, type RefObject } from 'react'
import { armarCamino, type Anclas, type DatosCamino } from '../../lib/camino'
import { CAMINO_DESKTOP, CAMINO_MOBILE } from '../../lib/caminoDatos'
import { Pin } from '../marca/Pin'

type CaminoProps = {
  /** La landing: el camino la mide entera y se recalcula cuando cambia de tamaño. */
  contenedorRef: RefObject<HTMLElement | null>
}

type Rect = { x: number; y: number; ancho: number; alto: number }

type Trazado = {
  datos: DatosCamino
  ancho: number
  alto: number
  d: string
  largo: number
  plaza: Rect | null
}

/* El ancho desde el que la landing pasa a desktop (breakpoint lg). */
const DESKTOP = 1024
/* El borde de la plataforma, igual de grueso que el del camino: (grosor − (grosor − 9)) / 2. */
const BORDE = 4.5

function medir(contenedor: HTMLElement): Trazado | null {
  const caja = contenedor.getBoundingClientRect()
  const datos = caja.width >= DESKTOP ? CAMINO_DESKTOP : CAMINO_MOBILE
  const anclas: Anclas = {}
  for (const elemento of contenedor.querySelectorAll<HTMLElement>('[data-camino]')) {
    const rect = elemento.getBoundingClientRect()
    anclas[elemento.dataset.camino ?? ''] = { top: rect.top - caja.top, bottom: rect.bottom - caja.top }
  }
  const camino = armarCamino(datos, anclas, caja.width)
  if (!camino) return null

  let plaza: Rect | null = null
  const boton = contenedor.querySelector(`[data-camino="${datos.plaza.ancla}"]`)
  if (boton) {
    const rect = boton.getBoundingClientRect()
    const ancho = rect.width + datos.plaza.extraAncho
    const alto = rect.height + datos.plaza.extraAlto
    plaza = { x: rect.left - caja.left + rect.width / 2 - ancho / 2, y: rect.top - caja.top + rect.height / 2 - alto / 2, ancho, alto }
  }
  return { datos, ancho: caja.width, alto: caja.height, ...camino, plaza }
}

function Plaza({ rect, crece = 0, className, transform }: { rect: Rect; crece?: number; className: string; transform?: string }) {
  return (
    <rect
      x={rect.x - crece}
      y={rect.y - crece}
      width={rect.ancho + crece * 2}
      height={rect.alto + crece * 2}
      rx={rect.alto / 2 + crece}
      transform={transform}
      className={className}
    />
  )
}

/**
 * La ruta celeste que recorre la landing por detrás de las secciones y termina en la plataforma del botón final.
 * La recorren los pinz, solos o en grupo. Con movimiento reducido queda dibujada y los pinz, quietos en su lugar.
 */
export function Camino({ contenedorRef }: CaminoProps) {
  const [trazado, setTrazado] = useState<Trazado | null>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    const observador = new ResizeObserver(() => setTrazado(medir(contenedor)))
    observador.observe(contenedor)
    return () => observador.disconnect()
  }, [contenedorRef])

  if (!trazado) return null
  const { datos, ancho, alto, d, largo, plaza } = trazado
  const trazo = { d, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  const duracion = largo / datos.velocidad
  const separacion = (datos.grosor * 1.15) / datos.velocidad

  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0 z-0" style={{ width: ancho, height: alto }}>
      <svg width={ancho} height={alto} className="absolute top-0 left-0 overflow-visible">
        <path {...trazo} strokeWidth={datos.grosor} transform="translate(6 6)" className="stroke-contorno" />
        {plaza && <Plaza rect={plaza} crece={BORDE} transform="translate(6 6)" className="fill-contorno" />}
        <path {...trazo} strokeWidth={datos.grosor} className="stroke-contorno" />
        {plaza && <Plaza rect={plaza} crece={BORDE} className="fill-contorno" />}
        <path {...trazo} strokeWidth={datos.grosor - BORDE * 2} className="stroke-cielo" />
        {plaza && <Plaza rect={plaza} className="fill-cielo" />}
      </svg>
      {datos.caminantes.flatMap((grupo, i) =>
        grupo.map((pinz, j) => {
          const atraso = (duracion * i) / datos.caminantes.length + separacion * j
          /* Quietos, cada grupo queda a mitad de su tramo: el primero no arranca escondido fuera de pantalla. */
          const quieto = ((i + 0.5) / datos.caminantes.length) * 100 - (separacion * j * 100) / duracion
          const estilo: CSSProperties = {
            offsetPath: `path('${d}')`,
            offsetRotate: '0deg',
            offsetAnchor: '50% 82%',
            offsetDistance: `${quieto}%`,
            animationDuration: `${duracion}s`,
            animationDelay: `${-atraso}s`,
          }
          return (
            <div key={pinz} className="absolute top-0 left-0 motion-safe:animate-camino" style={estilo}>
              <Pin pinz={pinz} size={datos.grosor * 1.3} label="" />
            </div>
          )
        }),
      )}
    </div>
  )
}
