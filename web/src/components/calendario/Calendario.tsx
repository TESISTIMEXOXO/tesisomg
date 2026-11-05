import { useEffect, type ReactNode } from 'react'
import { diasDeLaSemana, semanasDelMes } from '../../lib/fechas'
import { BarraCalendario } from './BarraCalendario'
import { ListaSemana } from './ListaSemana'
import type { AccionesExportar, ActividadCalendario, TramoCalendario, VistaCalendario } from './tipos'
import { moverFecha, tituloDelPeriodo, useEsCelular } from './utilidades'
import { VistaHoras } from './VistaHoras'
import { VistaMes } from './VistaMes'

export type CalendarioProps = {
  vista: VistaCalendario
  /** El día en el que se está parado: define qué semana o qué mes se ve. */
  fecha: string
  hoy: string
  /** "AAAA-MM-DDTHH:MM" en la hora del destino (relojEn), para la línea de ahora. */
  ahora: string | null
  actividades: ActividadCalendario[]
  tramos: TramoCalendario[]
  onCambiarVista: (vista: VistaCalendario) => void
  onCambiarFecha: (fecha: string) => void
  onAbrirActividad?: (actividad: ActividadCalendario) => void
  /** Solo si la persona puede editar el viaje: tocar un horario vacío abre "Agregar actividad" con ese día y hora. */
  onCrear?: (fecha: string, hora: string) => void
  exportar?: AccionesExportar
  /** Lo que va al lado del día en pantallas grandes: el mapa del día. */
  lateral?: ReactNode
}

const TECLAS: Record<string, VistaCalendario> = { d: 'dia', s: 'semana', m: 'mes' }

/** La Agenda como Google Calendar: Día, Semana y Mes sobre las mismas actividades del grupo. */
export function Calendario({
  vista,
  fecha,
  hoy,
  ahora,
  actividades,
  tramos,
  onCambiarVista,
  onCambiarFecha,
  onAbrirActividad,
  onCrear,
  exportar,
  lateral,
}: CalendarioProps) {
  const esCelular = useEsCelular()
  const dias = vista === 'dia' ? [fecha] : vista === 'semana' ? diasDeLaSemana(fecha) : semanasDelMes(fecha)

  function abrirDia(dia: string) {
    onCambiarFecha(dia)
    onCambiarVista('dia')
  }

  /* Los atajos de Google Calendar: D, S y M cambian la vista; H vuelve a hoy; las flechas, al período de al lado. */
  useEffect(() => {
    function atajo(evento: KeyboardEvent) {
      const destino = evento.target as HTMLElement
      if (evento.metaKey || evento.ctrlKey || evento.altKey || destino.closest('input, textarea, select, [contenteditable], [role="menu"], dialog')) return
      const tecla = evento.key.toLowerCase()
      if (TECLAS[tecla]) onCambiarVista(TECLAS[tecla])
      else if (tecla === 'h') onCambiarFecha(hoy)
      else if (tecla === 'j' || tecla === 'n') onCambiarFecha(moverFecha(vista, fecha, 1))
      else if (tecla === 'k' || tecla === 'p') onCambiarFecha(moverFecha(vista, fecha, -1))
    }
    document.addEventListener('keydown', atajo)
    return () => document.removeEventListener('keydown', atajo)
  }, [vista, fecha, hoy, onCambiarVista, onCambiarFecha])

  return (
    <div className="flex flex-col gap-5">
      <BarraCalendario
        vista={vista}
        titulo={tituloDelPeriodo(vista, fecha, dias)}
        onHoy={() => onCambiarFecha(hoy)}
        onMover={(direccion) => onCambiarFecha(moverFecha(vista, fecha, direccion))}
        onCambiarVista={onCambiarVista}
        exportar={exportar}
      />
      <div className={vista === 'dia' && lateral ? 'grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : ''}>
        <div className="overflow-hidden rounded-lg trazo bg-papel-elevado shadow-grande">
          {vista === 'mes' && (
            <VistaMes
              dias={dias}
              fecha={fecha}
              hoy={hoy}
              actividades={actividades}
              tramos={tramos}
              esCelular={esCelular}
              onAbrirDia={abrirDia}
              onAbrirActividad={onAbrirActividad}
            />
          )}
          {vista === 'semana' &&
            (esCelular ? (
              <ListaSemana dias={dias} hoy={hoy} actividades={actividades} tramos={tramos} onAbrirDia={abrirDia} onCrear={onCrear} />
            ) : (
              <VistaHoras
                dias={dias}
                hoy={hoy}
                ahora={ahora}
                actividades={actividades}
                tramos={tramos}
                onAbrirDia={abrirDia}
                onAbrirActividad={onAbrirActividad}
                onCrear={onCrear}
              />
            ))}
          {vista === 'dia' && (
            <VistaHoras dias={dias} hoy={hoy} ahora={ahora} actividades={actividades} tramos={tramos} onAbrirActividad={onAbrirActividad} onCrear={onCrear} />
          )}
        </div>
        {vista === 'dia' && lateral}
      </div>
    </div>
  )
}
