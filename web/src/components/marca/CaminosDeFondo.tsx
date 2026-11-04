/**
 * El fondo de la app, en papel-hundido: apenas más oscuro que el papel. Va dentro de un bloque `relative isolate`
 * que ocupa toda la página, así acompaña el scroll. Lo llevan todas las pantallas de la app, Emergencias incluida.
 */
export function CaminosDeFondo() {
  return <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-papel-hundido fondo-caminos" />
}
