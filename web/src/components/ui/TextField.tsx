import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Siempre visible arriba: el placeholder nunca lo reemplaza. */
  label: string
  hint?: string
  /** Dice qué hacer ("Poné un monto mayor a 0") y reemplaza a la ayuda. */
  error?: string
  /** Un botón chico adentro del campo, a la derecha (el ojo de la contraseña). */
  accion?: ReactNode
}

export function TextField({ label, hint, error, accion, id, className = '', ...resto }: TextFieldProps) {
  const idPropio = useId()
  const idCampo = id ?? idPropio
  const ayuda = error ?? hint
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={idCampo} className="text-etiqueta">
        {label}
      </label>
      <div className="relative flex flex-col">
        <input
          id={idCampo}
          aria-invalid={Boolean(error)}
          aria-describedby={ayuda ? `${idCampo}-ayuda` : undefined}
          className={`min-h-control rounded-sm bg-papel-elevado px-4 font-semibold text-tinta shadow-chica placeholder:font-medium placeholder:text-tinta-suave focus-visible:shadow-dura ${
            error ? 'border-3 border-negativo' : 'trazo'
          } ${accion ? 'pr-13' : ''}`}
          {...resto}
        />
        {accion && <div className="absolute inset-y-0 right-1 flex items-center">{accion}</div>}
      </div>
      {ayuda && (
        <span id={`${idCampo}-ayuda`} className={`text-meta ${error ? 'text-negativo' : 'text-tinta-suave'}`}>
          {ayuda}
        </span>
      )}
    </div>
  )
}
