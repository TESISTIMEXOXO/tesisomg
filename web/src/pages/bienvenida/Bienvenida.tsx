import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ElegirPinz } from '../../components/marca/ElegirPinz'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { TextField } from '../../components/ui/TextField'
import { useSesion } from '../../hooks/auth'
import { useGuardarPerfil } from '../../hooks/perfil'
import type { PinzId } from '../../pinz/elenco'
import { DatosPerfilSchema, MonedaSchema, type Moneda } from '../../types/perfil'

/** Completar perfil (HU-02): nombre, moneda y pinz. El resto se pide recién cuando hace falta. */
export function Bienvenida() {
  const navigate = useNavigate()
  const guardar = useGuardarPerfil()
  // Si entró con Google, ya viene con el nombre de la cuenta.
  const { data: sesion } = useSesion()
  const [nombre, setNombre] = useState(sesion?.nombre ?? '')
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [pinz, setPinz] = useState<PinzId | null>(null)
  const [errorNombre, setErrorNombre] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const datos = DatosPerfilSchema.safeParse({ nombre, moneda, pinz })
    if (!datos.success) {
      setErrorNombre(datos.error.issues.find((issue) => issue.path[0] === 'nombre')?.message)
      return
    }
    setErrorNombre(undefined)
    guardar.mutate(datos.data, { onSuccess: () => navigate('/viajes') })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-black">Armemos tu perfil</h1>
        <p className="text-cuerpo-lg text-tinta-suave">Contanos quién sos para que el grupo te reconozca.</p>
      </div>
      <TextField
        label="¿Cómo te llamás?"
        hint="Así te ve el grupo."
        autoComplete="given-name"
        value={nombre}
        error={errorNombre}
        onChange={(evento) => setNombre(evento.target.value)}
      />
      <fieldset>
        <legend className="mb-3 text-etiqueta">¿En qué moneda ves los montos?</legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MonedaSchema.options.map((opcion) => (
            <Chip key={opcion} selected={moneda === opcion} onClick={() => setMoneda(opcion)}>
              {opcion}
            </Chip>
          ))}
        </div>
      </fieldset>
      <ElegirPinz valor={pinz} onElegir={setPinz} />
      {guardar.isError && (
        <p role="alert" className="font-semibold text-negativo">
          No pudimos guardar tu perfil. Revisá la conexión y probá de nuevo.
        </p>
      )}
      <Button type="submit" full disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : 'Guardar perfil'}
      </Button>
    </form>
  )
}
