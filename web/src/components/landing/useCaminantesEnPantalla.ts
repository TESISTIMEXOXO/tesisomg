import { useLayoutEffect, useRef } from 'react'
import type { Punto } from '../../lib/camino'

/* Cada cuánto se revisa quién está a la vista. El margen tiene que cubrir lo que camina un pinz en ese tiempo, y su tamaño. */
const CADA_MS = 250
const MARGEN = 200
/* Hasta dónde puede estar afuera el pie de un pinz sin que se le vea nada: la mitad del pinz más grande. */
const ASOMA = 48
/* Cuánto antes de entrar arranca el primero, en px: mientras se monta, el reloj sigue. */
const ANTES_DE_ENTRAR = 60
/* El humo solo corre cerca de su explosión: el resto de la vuelta es invisible. */
const VENTANA_HUMO_MS = 2000

/** Enciende o apaga un grupo de animaciones sin perderles la hora: todas cuentan desde el mismo origen. */
function encender(elemento: HTMLElement, animaciones: Animation[], activo: boolean, origen: number) {
  const estabaActivo = elemento.style.visibility !== 'hidden'
  if (activo === estabaActivo) return
  elemento.style.visibility = activo ? '' : 'hidden'
  for (const animacion of animaciones) {
    if (activo) animacion.startTime = origen
    else animacion.pause()
  }
}

function enProgreso(puntos: readonly Punto[], progreso: number) {
  return puntos[Math.min(puntos.length - 1, Math.floor(progreso * puntos.length))]
}

/**
 * Los caminantes se mueven con offset-path, que el navegador recalcula en cada cuadro aunque estén fuera de pantalla.
 * Acá se pausan y se esconden los que no se ven, y al volver retoman donde estarían si nunca hubieran frenado.
 * `montados` avisa que se sumaron caminantes: entran de a poco para no trabar la página.
 */
export function useCaminantesEnPantalla(contenedor: HTMLElement | null, recorridos: Record<string, readonly Punto[]> | null, montados: number) {
  /*
   * El que al montarse ya estaría a la vista aparecería de la nada: espera escondido hasta salir de la pantalla
   * o empezar otra vuelta (el arco de arriba nunca sale), y entra caminando. Se guarda en qué punto de la vuelta estaba.
   */
  const esperando = useRef(new WeakMap<HTMLElement, number>())
  const revisados = useRef(new WeakSet<HTMLElement>())
  const conHora = useRef(new WeakSet<Animation>())
  /* Desde cuándo cuenta cada trazo. Se fija una sola vez: si cambiara al recalcular el camino, los pinz saltarían. */
  const origenes = useRef<Record<string, number>>({})

  /* Antes de pintar: si no, los que esperan se ven un cuadro. */
  useLayoutEffect(() => {
    if (!contenedor || !recorridos || !montados || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const vista = (margen: number) => {
      const arriba = -contenedor.getBoundingClientRect().top - margen
      const abajo = arriba + window.innerHeight + margen * 2
      const derecha = window.innerWidth + margen
      return ([x, y]: Punto) => y >= arriba && y <= abajo && x >= -margen && x <= derecha
    }

    /* El que abre la marcha arranca justo afuera del primer tramo a la vista: así el primer pinz entra enseguida. */
    const alEmpezar = Number(document.timeline.currentTime ?? 0)
    for (const lider of contenedor.querySelectorAll<HTMLElement>('[data-entra-primero]')) {
      const nombre = lider.dataset.trazo ?? ''
      const puntos = recorridos[nombre]
      const { delay, duration } = lider.getAnimations()[0]?.effect?.getComputedTiming() ?? {}
      if (!puntos || nombre in origenes.current || typeof duration !== 'number') continue
      const entrada = puntos.findIndex(vista(ASOMA))
      const paso = Math.hypot(puntos[1][0] - puntos[0][0], puntos[1][1] - puntos[0][1])
      const inicio = Math.max(0, entrada - ANTES_DE_ENTRAR / paso)
      const origen = alEmpezar - Number(delay) - (inicio / puntos.length) * duration
      /* Una vuelta antes si cayó en el futuro: hasta esa hora, los de atrás no arrancan y quedan quietos en la mitad del camino. */
      origenes.current[nombre] = origen > alEmpezar ? origen - duration : origen
    }

    const caminantes = [...contenedor.querySelectorAll<HTMLElement>('[data-trazo]')].flatMap((elemento) => {
      const [caminata] = elemento.getAnimations()
      const nombre = elemento.dataset.trazo ?? ''
      const puntos = recorridos[nombre]
      if (!caminata || !puntos) return []
      const humo = elemento.nextElementSibling instanceof HTMLElement && elemento.nextElementSibling.dataset.humo ? elemento.nextElementSibling : null
      return [
        {
          elemento,
          caminata,
          puntos,
          origen: origenes.current[nombre] ?? 0,
          animaciones: elemento.getAnimations({ subtree: true }),
          humo,
          animacionesHumo: humo ? humo.getAnimations({ subtree: true }) : [],
          progresoHumo: Number(humo?.dataset.humo ?? 0) / 100,
        },
      ]
    })

    /* Solo a las nuevas: ponerle la hora a una pausada la volvería a arrancar. */
    for (const { animaciones, animacionesHumo, origen } of caminantes) {
      for (const animacion of [...animaciones, ...animacionesHumo]) {
        if (conHora.current.has(animacion)) continue
        conHora.current.add(animacion)
        animacion.startTime = origen
      }
    }

    const revisar = () => {
      const ahora = Number(document.timeline.currentTime ?? 0)
      const seVe = vista(MARGEN)
      const estaAdentro = vista(ASOMA)

      for (const { elemento, caminata, puntos, origen, animaciones, humo, animacionesHumo, progresoHumo } of caminantes) {
        const { delay, duration } = caminata.effect?.getComputedTiming() ?? {}
        if (typeof duration !== 'number' || !duration) continue
        const transcurrido = (((ahora - origen - Number(delay)) % duration) + duration) % duration
        const progreso = transcurrido / duration
        const punto = enProgreso(puntos, progreso)
        if (!revisados.current.has(elemento)) {
          revisados.current.add(elemento)
          if (estaAdentro(punto)) esperando.current.set(elemento, progreso)
        }
        if (!seVe(punto) || progreso < (esperando.current.get(elemento) ?? 0)) esperando.current.delete(elemento)
        encender(elemento, animaciones, seVe(punto) && !esperando.current.has(elemento), origen)

        if (humo) {
          const cerca = Math.abs(progreso - progresoHumo) * duration < VENTANA_HUMO_MS
          encender(humo, animacionesHumo, cerca && seVe(enProgreso(puntos, progresoHumo)), origen)
        }
      }
    }

    revisar()
    const intervalo = window.setInterval(revisar, CADA_MS)
    window.addEventListener('scroll', revisar, { passive: true })
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener('scroll', revisar)
    }
  }, [contenedor, recorridos, montados])
}
