import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'

/** Unirse con el código de seis caracteres (HU-06). Lleva a la vista previa del viaje. */
export function Unirse() {
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
    navigate(`/unirse/${limpio}`)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-black">Unirse a un viaje</h1>
        <p className="text-cuerpo-lg text-tinta-suave">Poné el código que te pasaron. Antes de sumarte, ves a qué viaje entrás.</p>
      </div>
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
