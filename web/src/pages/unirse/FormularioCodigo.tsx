import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'

type FormularioCodigoProps = {
  /** El título y la bajada: en la página son más grandes que en la ventana del +. */
  encabezado: ReactNode
  idTitulo?: string
  /** Antes de ir a la vista previa, por ejemplo para cerrar la ventana. */
  onListo?: () => void
  className?: string
}

/** El código de seis caracteres para sumarse a un viaje (HU-06). Lleva a la vista previa del viaje. */
export function FormularioCodigo({ encabezado, idTitulo, onListo, className = '' }: FormularioCodigoProps) {
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const limpio = codigo.trim().toUpperCase()
    if (limpio.length !== 6) {
      setError('El código tiene seis caracteres.')
      return
    }
    onListo?.()
    navigate(`/unirse/${limpio}`)
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className={`flex flex-col ${className}`}>
      {encabezado}
      <TextField
        label="Código del viaje"
        hint="Seis letras y números, como BRL427."
        maxLength={6}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={codigo}
        error={error}
        onChange={(evento) => setCodigo(evento.target.value)}
      />
      <Button type="submit" full>
        Ver el viaje
      </Button>
    </form>
  )
}
