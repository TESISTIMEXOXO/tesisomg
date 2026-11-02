import { useEffect, useRef, useState } from 'react'
import { useBuscarLugares } from '../../hooks/viajes'
import type { LugarViaje } from '../../types/viaje'
import { TextField } from './TextField'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (lugar: LugarViaje) => void
  error?: string
  hayUbicacion?: boolean
}

export function SelectorLugar({ label, value, onChange, onSelect, error, hayUbicacion = false }: Props) {
  const [consulta, setConsulta] = useState('')
  const seleccionado = useRef(hayUbicacion)
  const sugerencias = useBuscarLugares(consulta)

  useEffect(() => {
    if (seleccionado.current) return
    const temporizador = window.setTimeout(
      () => setConsulta(value.trim().length >= 3 ? value.trim() : ''),
      450,
    )
    return () => window.clearTimeout(temporizador)
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      <TextField
        label={label}
        value={value}
        error={error}
        onChange={(evento) => {
          seleccionado.current = false
          onChange(evento.target.value)
        }}
      />
      {consulta && (
        <div className="rounded-md trazo bg-papel-elevado p-2" role="listbox" aria-label="Lugares sugeridos">
          {sugerencias.isPending && <p className="p-3 text-meta text-tinta-suave">Buscando lugares…</p>}
          {sugerencias.error && <p role="alert" className="p-3 text-meta text-negativo">No pudimos buscar lugares. Revisá la conexión y probá de nuevo.</p>}
          {sugerencias.data?.map((lugar) => (
            <button
              key={lugar.id}
              type="button"
              role="option"
              onClick={() => {
                onSelect(lugar)
                seleccionado.current = true
                setConsulta('')
              }}
              className="flex min-h-toque w-full flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-papel-hundido"
            >
              <span className="font-bold">{lugar.nombre}</span>
              <span className="text-meta text-tinta-suave">{lugar.detalle}</span>
            </button>
          ))}
          {sugerencias.data?.length === 0 && <p className="p-3 text-meta text-tinta-suave">No encontramos lugares con ese nombre.</p>}
        </div>
      )}
    </div>
  )
}
