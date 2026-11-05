import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Download, Smartphone } from 'lucide-react'
import { Button } from '../ui/Button'
import { Menu, OpcionMenu } from './Menu'
import type { AccionesExportar, VistaCalendario } from './tipos'
import { NOMBRES_VISTA } from './utilidades'

type BarraCalendarioProps = {
  vista: VistaCalendario
  titulo: string
  onHoy: () => void
  onMover: (direccion: 1 | -1) => void
  onCambiarVista: (vista: VistaCalendario) => void
  exportar?: AccionesExportar
}

const ATAJOS: Record<VistaCalendario, string> = { dia: 'D', semana: 'S', mes: 'M' }
const ANTERIOR: Record<VistaCalendario, string> = { dia: 'Día anterior', semana: 'Semana anterior', mes: 'Mes anterior' }
const SIGUIENTE: Record<VistaCalendario, string> = { dia: 'Día siguiente', semana: 'Semana siguiente', mes: 'Mes siguiente' }

/** Hoy, las flechas y el período a la izquierda; la vista y "Agregar a mi calendario" a la derecha. */
export function BarraCalendario({ vista, titulo, onHoy, onMover, onCambiarVista, exportar }: BarraCalendarioProps) {
  return (
    <div className="relative z-40 flex flex-wrap items-center gap-x-2 gap-y-3 md:gap-x-4">
      <div className="flex items-center gap-1 md:gap-1.5">
        <Button variant="secundario" size="sm" onClick={onHoy}>
          Hoy
        </Button>
        <Button variant="fantasma" size="icono" icon={ChevronLeft} aria-label={ANTERIOR[vista]} onClick={() => onMover(-1)} />
        <Button variant="fantasma" size="icono" icon={ChevronRight} aria-label={SIGUIENTE[vista]} onClick={() => onMover(1)} />
      </div>
      <h3 aria-live="polite" className="min-w-0 font-display text-titulo-2 font-black text-balance max-md:order-first max-md:w-full lg:text-titulo-1">
        {titulo}
      </h3>
      <div className="ms-auto flex items-center gap-1.5 md:gap-2">
        <Menu etiqueta={NOMBRES_VISTA[vista]} etiquetaAccesible={`Vista: ${NOMBRES_VISTA[vista]}`} lado="derecha">
          {(Object.keys(NOMBRES_VISTA) as VistaCalendario[]).map((opcion) => (
            <OpcionMenu key={opcion} elegida={opcion === vista} detalle={ATAJOS[opcion]} onElegir={() => onCambiarVista(opcion)}>
              {NOMBRES_VISTA[opcion]}
            </OpcionMenu>
          ))}
        </Menu>
        {exportar && (
          <Menu
            etiqueta="Agregar a mi calendario"
            icono={CalendarPlus}
            lado="derecha"
            compactoEnCelular
            pie="Se actualiza solo con lo que agregue el grupo. En Google, lo nuevo puede tardar unas horas."
          >
            <OpcionMenu icono={CalendarDays} onElegir={exportar.onGoogle}>
              Google Calendar
            </OpcionMenu>
            <OpcionMenu icono={Smartphone} onElegir={exportar.onIphone}>
              Calendario del iPhone
            </OpcionMenu>
            <OpcionMenu icono={Download} onElegir={exportar.onDescargar}>
              Descargar archivo .ics
            </OpcionMenu>
          </Menu>
        )}
      </div>
    </div>
  )
}
