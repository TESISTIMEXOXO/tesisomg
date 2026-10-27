import { useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Siempre visible arriba: el placeholder nunca lo reemplaza. */
  label: string
  hint?: string
  /** Dice qué hacer ("Poné un monto mayor a 0") y reemplaza a la ayuda. */
  error?: string
}

export function TextField({ label, hint, error, id, className = '', ...resto }: TextFieldProps) {
  const idPropio = useId()
  const idCampo = id ?? idPropio
  const ayuda = error ?? hint
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={idCampo} className="text-etiqueta">
        {label}
      </label>
      <input
        id={idCampo}
        aria-invalid={Boolean(error)}
        aria-describedby={ayuda ? `${idCampo}-ayuda` : undefined}
        className={`min-h-control rounded-sm bg-papel-elevado px-4 font-semibold text-tinta shadow-chica placeholder:font-medium placeholder:text-tinta-suave focus-visible:shadow-dura ${
          error ? 'border-3 border-negativo' : 'trazo'
        }`}
        {...resto}
      />
      {ayuda && (
        <span id={`${idCampo}-ayuda`} className={`text-meta ${error ? 'text-negativo' : 'text-tinta-suave'}`}>
          {ayuda}
        </span>
      )}
    </div>
  )
}
