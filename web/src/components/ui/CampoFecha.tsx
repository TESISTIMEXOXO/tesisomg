import { CalendarDays } from 'lucide-react'
import { useId, useRef, useState } from 'react'

type CampoFechaProps = {
  label: string
  /** "aaaa-mm-dd", o vacío si todavía no hay una fecha completa y válida. */
  value: string
  onChange: (valor: string) => void
  /** "aaaa-mm-dd": fechas anteriores se marcan como error. */
  min?: string
  hint?: string
  error?: string
}

/** "aaaa-mm-dd" → "dd/mm/aaaa". */
function aTexto(valor: string) {
  const [anio, mes, dia] = valor.split('-')
  return valor ? `${dia}/${mes}/${anio}` : ''
}

/** "dd/mm/aaaa" → "aaaa-mm-dd", o vacío si la fecha no existe (31/02, 00/05…). */
function aValor(texto: string) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!partes) return ''
  const [, dia, mes, anio] = partes
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia))
  if (fecha.getDate() !== Number(dia) || fecha.getMonth() !== Number(mes) - 1) return ''
  return `${anio}-${mes}-${dia}`
}

/** Pone las barras mientras se escribe: "2510" → "25/10". */
function conBarras(texto: string) {
  const digitos = texto.replace(/\D/g, '').slice(0, 8)
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)].filter(Boolean).join('/')
}

/**
 * Fecha siempre en dd/mm/aaaa. El input type="date" del navegador usa el idioma del navegador
 * (en uno en inglés muestra mm/dd/yyyy), así que se escribe en un campo de texto y el calendario
 * nativo queda solo para el botón.
 */
export function CampoFecha({ label, value, onChange, min, hint, error }: CampoFechaProps) {
  const id = useId()
  const calendario = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState(() => aTexto(value))
  const [valorAnterior, setValorAnterior] = useState(value)

  // Si el valor cambia desde afuera (el calendario, un formulario que se vacía), se muestra ese.
  if (value !== valorAnterior) {
    setValorAnterior(value)
    if (aValor(texto) !== value) setTexto(aTexto(value))
  }

  const completo = texto.length === 10
  const errorPropio = completo && !aValor(texto)
    ? 'Esa fecha no existe. Escribila como dd/mm/aaaa.'
    : completo && min && aValor(texto) < min
      ? `Tiene que ser desde el ${aTexto(min)}.`
      : undefined
  const ayuda = error ?? errorPropio ?? hint ?? 'dd/mm/aaaa'
  const conError = Boolean(error ?? errorPropio)

  function abrirCalendario() {
    const campo = calendario.current
    if (!campo) return
    try {
      campo.showPicker()
    } catch {
      campo.focus()
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-etiqueta">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={texto}
          aria-invalid={conError}
          aria-describedby={`${id}-ayuda`}
          onChange={(evento) => {
            const nuevo = conBarras(evento.target.value)
            setTexto(nuevo)
            onChange(aValor(nuevo))
          }}
          className={`min-h-control w-full rounded-sm bg-papel-elevado pl-4 pr-14 font-semibold text-tinta shadow-chica placeholder:font-medium placeholder:text-tinta-suave focus-visible:shadow-dura ${
            conError ? 'border-3 border-negativo' : 'trazo'
          }`}
        />
        <button
          type="button"
          onClick={abrirCalendario}
          aria-label={`Elegir ${label.toLowerCase()} en el calendario`}
          className="absolute inset-y-0 right-0 flex min-w-toque items-center justify-center rounded-r-sm text-tinta hover:bg-papel-hundido"
        >
          <CalendarDays aria-hidden className="size-5" />
        </button>
        <input
          ref={calendario}
          type="date"
          tabIndex={-1}
          aria-hidden
          min={min}
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          className="pointer-events-none absolute bottom-0 left-0 size-0 opacity-0"
        />
      </div>
      <span id={`${id}-ayuda`} className={`text-meta ${conError ? 'text-negativo' : 'text-tinta-suave'}`}>
        {ayuda}
      </span>
    </div>
  )
}
