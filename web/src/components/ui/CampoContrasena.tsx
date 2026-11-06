import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { TextField, type TextFieldProps } from './TextField'

/** Un TextField de contraseña con el ojo para mostrarla mientras se escribe. */
export function CampoContrasena(props: Omit<TextFieldProps, 'type' | 'accion'>) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeOff : Eye
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      accion={
        <button
          type="button"
          onClick={() => setVisible((antes) => !antes)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="grid size-11 place-items-center rounded-sm text-tinta-suave hover:text-tinta"
        >
          <Icono size={20} strokeWidth={2} aria-hidden />
        </button>
      }
    />
  )
}
