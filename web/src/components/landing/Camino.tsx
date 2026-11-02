import { Fragment, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { armarCamino, armarRodeo, muestrear, repartirGrupos, type Anclas, type DatosCamino, type Punto } from '../../lib/camino'
import { CAMINO_DESKTOP, CAMINO_MOBILE } from '../../lib/caminoDatos'
import type { PinzId } from '../../pinz/elenco'
import { Pin } from '../marca/Pin'
import { useCaminantesEnPantalla } from './useCaminantesEnPantalla'

type CaminoProps = {
  /** La landing: el camino la mide entera y se recalcula cuando cambia de tamaño. */
  contenedor: HTMLElement | null
}

type Rect = { x: number; y: number; ancho: number; alto: number }

type Trazado = {
  datos: DatosCamino
  ancho: number
  alto: number
  d: string
  largo: number
  finX: number
  puntos: Punto[]
  /** Cuántos px del final del camino quedan tapados por el botón. */
  tapado: number
  plaza: Rect | null
  rodeo: { d: string; largo: number } | null
}

/* El ancho desde el que la landing pasa a desktop (breakpoint lg). */
const DESKTOP = 1024
/* El borde de la plataforma, igual de grueso que el del camino: (grosor − (grosor − 9)) / 2. */
const BORDE = 4.5
/* Lo mínimo entre el camino del rodeo y lo que haya a su izquierda en la barra. */
const AIRE_VECINO = 12
/* En ms: los pinz caminan más lento de lo que se dibuja el camino, así que pueden salir antes de que termine. */
const ESPERA_CAMINANTES = 600
/* En ms: lo que dura animate-trazar, y la pausa entre un grupo de pinz y el siguiente. */
const FIN_DEL_DIBUJO = 3000
const ENTRE_GRUPOS = 100
/* A cuántos grosores de camino del botón explota un pinz. */
const AIRE_EXPLOSION = 0.9
/* En segundos: lo que tarda el pinz en estallar y lo que dura la nube. */
const DURACION_ESTALLIDO = 0.14
const DURACION_HUMO = 0.75
/*
 * El reloj de la explosión reinicia 1 s después de que el pinz vuelve al principio, ya fuera de pantalla.
 * Si reiniciara junto con la caminata, el navegador puede mostrarlo entero un cuadro al final del camino, sobre el botón.
 */
const DESFASE_RELOJ = 1

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
  let tapado = 0
  const boton = contenedor.querySelector(`[data-camino="${datos.plaza.ancla}"]`)
  if (boton) {
    const rect = boton.getBoundingClientRect()
    const ancho = rect.width + datos.plaza.extraAncho
    const alto = rect.height + datos.plaza.extraAlto
    plaza = { x: rect.left - caja.left + rect.width / 2 - ancho / 2, y: rect.top - caja.top + rect.height / 2 - alto / 2, ancho, alto }
    tapado = Math.max(0, rect.right - caja.left - camino.finX)
  }

  let rodeo: Trazado['rodeo'] = null
  const acceso = contenedor.querySelector('[data-camino="acceso"]')
  if (acceso) {
    const rect = acceso.getBoundingClientRect()
    /* El menú está oculto en mobile y mide cero: el vecino es lo que termine más a la derecha, sea menú o logo. */
    const hermanos = [...(acceso.parentElement?.children ?? [])].filter((hermano) => hermano !== acceso)
    const vecino = Math.max(0, ...hermanos.map((hermano) => hermano.getBoundingClientRect().right))
    const h1 = datos.rodeo.esquivaTitulo ? contenedor.querySelector('h1')?.getBoundingClientRect() : null
    /* La barra es sticky y arranca arriba de la landing: se mide contra ella para que el scroll no corra el arco. */
    const barra = acceso.parentElement?.getBoundingClientRect().top ?? caja.top
    rodeo = armarRodeo(
      datos,
      { izquierda: rect.left - caja.left, abajo: rect.bottom - barra },
      caja.width,
      vecino - caja.left + AIRE_VECINO,
      h1 ? { derecha: h1.right - caja.left, arriba: h1.top - caja.top } : null,
    )
  }
  return { datos, ancho: caja.width, alto: caja.height, ...camino, tapado, plaza, rodeo }
}

function Plaza({ rect, crece = 0, className }: { rect: Rect; crece?: number; className: string }) {
  return (
    <rect
      x={rect.x - crece}
      y={rect.y - crece}
      width={rect.ancho + crece * 2}
      height={rect.alto + crece * 2}
      rx={rect.alto / 2 + crece}
      className={className}
    />
  )
}

type CaminantesProps = {
  nombreTrazo: string
  datos: DatosCamino
  grupos: readonly (readonly PinzId[])[]
  /** Cuántos grupos ya entraron a la página. El lugar de cada uno se calcula siempre con el total. */
  montados: number
  d: string
  largo: number
  /** Si el camino termina a la vista, cuántos px del final tapa el botón: el pinz explota antes de meterse debajo. */
  tapado?: number
}

/** Una nube chica: los círculos se abren desde el centro al crecer. */
function Humo({ grosor }: { grosor: number }) {
  return (
    <svg viewBox="0 0 100 100" width={grosor * 1.5} height={grosor * 1.5} className="block fill-tinta-suave">
      <path d="M50 18a17 17 0 0 1 16 11 16 16 0 0 1 17 16 15 15 0 0 1-5 27 15 15 0 0 1-22 8 17 17 0 0 1-24-3 15 15 0 0 1-15-26 16 16 0 0 1 17-22 17 17 0 0 1 16-11Z" />
      <circle cx="12" cy="24" r="6" />
      <circle cx="90" cy="20" r="5" />
      <circle cx="90" cy="88" r="4" />
    </svg>
  )
}

function Caminantes({ nombreTrazo, datos, grupos, montados, d, largo, tapado }: CaminantesProps) {
  const duracion = largo / datos.velocidad
  const separacion = (datos.grosor * 1.15) / datos.velocidad
  const explosion = tapado === undefined ? 0 : (largo - tapado - datos.grosor * AIRE_EXPLOSION) / datos.velocidad
  /* Los % de las curvas dependen del largo de cada camino; por eso se arman acá y no en los keyframes. */
  const enReloj = (segundos: number) => ((explosion + segundos - DESFASE_RELOJ) / duracion) * 100
  const curvaPinz = `linear(0, 0 ${enReloj(0)}%, 1 ${enReloj(DURACION_ESTALLIDO)}%, 1)`
  const curvaCrece = `linear(0, 0 ${enReloj(0)}%, 0.7 ${enReloj(DURACION_HUMO * 0.25)}%, 1 ${enReloj(DURACION_HUMO)}%, 1)`
  const curvaAparece = `linear(0, 0 ${enReloj(0)}%, 1 ${enReloj(DURACION_HUMO * 0.15)}%, 1 ${enReloj(DURACION_HUMO * 0.4)}%, 0 ${enReloj(DURACION_HUMO)}%, 0)`
  return grupos.slice(0, montados).flatMap((grupo, i) =>
    grupo.map((pinz, j) => {
      const atraso = (duracion * i) / grupos.length + separacion * j
      const relojLlegada: CSSProperties = { animationDuration: `${duracion}s`, animationDelay: `${DESFASE_RELOJ - duracion - atraso}s` }
      /* Quietos, cada grupo queda a mitad de su tramo: el primero no arranca escondido fuera de pantalla. */
      const quieto = ((i + 0.5) / grupos.length) * 100 - (separacion * j * 100) / duracion
      const pinzCaminando = (
        /* Cada uno con su desfase: si dan el paso a la vez parecen una sola pieza. */
        <div className="motion-safe:animate-paso" style={{ transformOrigin: '50% 82%', animationDelay: `${-(i * 0.17 + j * 0.23)}s` }}>
          <Pin pinz={pinz} size={datos.grosor * 1.3} label="" />
        </div>
      )
      const estilo: CSSProperties = {
        offsetPath: `path('${d}')`,
        offsetRotate: '0deg',
        offsetAnchor: '50% 82%',
        offsetDistance: `${quieto}%`,
        animationDuration: `${duracion}s`,
        animationDelay: `${-atraso}s`,
      }
      return (
        <Fragment key={`${i}-${pinz}`}>
          {/* El último del primer grupo es el que va más adelante. */}
          <div
            data-trazo={nombreTrazo}
            data-entra-primero={i === 0 && j === grupo.length - 1 ? '' : undefined}
            className="absolute top-0 left-0 motion-safe:animate-camino"
            style={estilo}
          >
            {tapado !== undefined ? (
              <div className="motion-safe:animate-llegada" style={{ ...relojLlegada, transformOrigin: '50% 50%', animationTimingFunction: curvaPinz }}>
                {pinzCaminando}
              </div>
            ) : (
              pinzCaminando
            )}
          </div>
          {tapado !== undefined && (
            /* Se queda donde explotó el pinz, sin seguirlo: por eso va sobre el camino y no adentro del que camina. */
            <div
              data-humo={(explosion / duracion) * 100}
              className="absolute top-0 left-0"
              style={{ offsetPath: `path('${d}')`, offsetRotate: '0deg', offsetAnchor: '50% 62%', offsetDistance: `${(explosion / duracion) * 100}%` }}
            >
              <div
                className="opacity-0 motion-safe:animate-humo"
                style={{ ...relojLlegada, animationTimingFunction: `${curvaCrece}, ${curvaAparece}` }}
              >
                <Humo grosor={datos.grosor} />
              </div>
            </div>
          )}
        </Fragment>
      )
    }),
  )
}

/**
 * La ruta celeste que recorre la landing por detrás de las secciones y termina en la plataforma del botón final.
 * La recorren los pinz, solos o en grupo, y explotan en una nubecita de humo al llegar al botón. Con movimiento reducido queda dibujada y los pinz, quietos en su lugar.
 */
export function Camino({ contenedor }: CaminoProps) {
  const [trazado, setTrazado] = useState<Trazado | null>(null)
  const [gruposMontados, setGruposMontados] = useState(0)

  useLayoutEffect(() => {
    if (!contenedor) return
    /* flushSync: el observador avisa antes de pintar, y así el camino entra en el mismo cuadro que el texto. */
    const observador = new ResizeObserver(() => flushSync(() => setTrazado(medir(contenedor))))
    observador.observe(contenedor)
    return () => observador.disconnect()
  }, [contenedor])

  const grupos = useMemo(() => (trazado ? repartirGrupos(trazado.datos, trazado.largo, trazado.ancho) : []), [trazado])

  /*
   * Montar a todos los pinz juntos traba la página un momento y el camino se frena a medio dibujar.
   * Los que abren la marcha entran enseguida porque son pocos; el resto, de a un grupo y con el dibujo terminado.
   */
  useEffect(() => {
    if (!grupos.length || gruposMontados >= grupos.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const temporizador = window.setTimeout(() => setGruposMontados(grupos.length))
      return () => window.clearTimeout(temporizador)
    }
    const espera = gruposMontados === 0 ? ESPERA_CAMINANTES : gruposMontados === 1 ? FIN_DEL_DIBUJO - ESPERA_CAMINANTES : ENTRE_GRUPOS
    const temporizador = window.setTimeout(() => setGruposMontados((montados) => montados + 1), espera)
    return () => window.clearTimeout(temporizador)
  }, [grupos, gruposMontados])

  const recorridos = useMemo(
    () => (trazado ? { principal: trazado.puntos, ...(trazado.rodeo && { rodeo: muestrear(trazado.rodeo.d, 40) }) } : null),
    [trazado],
  )
  useCaminantesEnPantalla(contenedor, recorridos, gruposMontados)

  if (!trazado) return null
  const { datos, ancho, alto, d, largo, tapado, plaza, rodeo } = trazado
  const trazo = { d, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1, className: 'motion-safe:animate-trazar' } as const
  /* El arco de arriba es corto: con el mismo tiempo y arranque lento que el camino largo parecería trabado. */
  const trazoRodeo = { ...trazo, d: rodeo?.d, style: { animationDuration: '1.1s', animationTimingFunction: 'ease-out' } }

  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0 z-0" style={{ width: ancho, height: alto }}>
      <svg width={ancho} height={alto} className="absolute top-0 left-0 overflow-visible">
        {rodeo && (
          <>
            <path {...trazoRodeo} strokeWidth={datos.grosor} className={`stroke-contorno ${trazo.className}`} />
            <path {...trazoRodeo} strokeWidth={datos.grosor - BORDE * 2} className={`stroke-cielo ${trazo.className}`} />
          </>
        )}
        <path {...trazo} strokeWidth={datos.grosor} className={`stroke-contorno ${trazo.className}`} />
        {plaza && <Plaza rect={plaza} crece={BORDE} className="fill-contorno motion-safe:animate-fundido [animation-delay:2.8s]" />}
        <path {...trazo} strokeWidth={datos.grosor - BORDE * 2} className={`stroke-cielo ${trazo.className}`} />
        {plaza && <Plaza rect={plaza} className="fill-cielo motion-safe:animate-fundido [animation-delay:2.8s]" />}
      </svg>
      <Caminantes nombreTrazo="principal" datos={datos} grupos={grupos} montados={gruposMontados} d={d} largo={largo} tapado={tapado} />
      {rodeo && <Caminantes nombreTrazo="rodeo" datos={datos} grupos={datos.rodeo.caminantes} montados={gruposMontados} d={rodeo.d} largo={rodeo.largo} />}
    </div>
  )
}
