import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useEditarVotacion, useEliminarVotacion } from '../../hooks/votaciones'
import { EditarVotacionSchema, type Votacion } from '../../types/votacion'

type EditarVotacionProps = {
  votacion: Votacion
  idTitulo: string
  onCerrar: () => void
}

/** Solo para quien organiza: cambiar la pregunta y las opciones, sacar opciones o borrar la votación entera. */
export function EditarVotacion({ votacion, idTitulo, onCerrar }: EditarVotacionProps) {
  const editar = useEditarVotacion(votacion.viajeId)
  const eliminar = useEliminarVotacion(votacion.viajeId)
  const [pregunta, setPregunta] = useState(votacion.pregunta)
  const [opciones, setOpciones] = useState(votacion.opciones.map(({ id, nombre }) => ({ id, nombre })))
  const [error, setError] = useState<string>()
  const [confirmaEliminar, setConfirmaEliminar] = useState(false)
  const ocupado = editar.isPending || eliminar.isPending

  function renombrar(id: string, nombre: string) {
    setOpciones((actuales) => actuales.map((opcion) => (opcion.id === id ? { ...opcion, nombre } : opcion)))
  }

  function sacar(id: string) {
    setOpciones((actuales) => actuales.filter((opcion) => opcion.id !== id))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const resultado = EditarVotacionSchema.safeParse({ pregunta, opciones })
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    setError(undefined)
    editar.mutate({ votacionId: votacion.id, datos: resultado.data }, { onSuccess: onCerrar })
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className="flex flex-col gap-4">
      <h2 id={idTitulo} className="pr-24 font-display text-titulo-1 font-black">Editar votación</h2>
      <TextField label="Pregunta" value={pregunta} onChange={(evento) => setPregunta(evento.target.value)} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-etiqueta">Opciones</legend>
        {opciones.length === 0 && <p className="text-tinta-suave">No quedan opciones. El grupo puede proponer nuevas.</p>}
        {opciones.map((opcion, indice) => (
          <div key={opcion.id} className="flex items-end gap-2">
            <TextField label={`Opción ${indice + 1}`} value={opcion.nombre} onChange={(evento) => renombrar(opcion.id, evento.target.value)} className="flex-1" />
            <button
              type="button"
              onClick={() => sacar(opcion.id)}
              aria-label={`Sacar la opción ${opcion.nombre || indice + 1}`}
              className="grid size-control flex-none place-items-center rounded-full hover:bg-papel-hundido"
            >
              <Trash2 size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ))}
        {opciones.length < votacion.opciones.length && (
          <p className="text-meta text-tinta-suave">Al guardar, las opciones que sacaste se borran con sus votos.</p>
        )}
      </fieldset>

      {error && <p role="alert" className="font-semibold text-negativo">{error}</p>}
      {editar.isError && <p role="alert" className="font-semibold text-negativo">No pudimos guardar los cambios. Revisá la conexión y probá de nuevo.</p>}
      {eliminar.isError && <p role="alert" className="font-semibold text-negativo">No pudimos borrar la votación. Probá de nuevo.</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="secundario" disabled={ocupado}>
          {editar.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button variant="fantasma" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>

      <div className="flex flex-col items-start gap-2 trazo-t pt-4">
        <Button
          variant="fantasma"
          size="sm"
          icon={Trash2}
          disabled={ocupado}
          onClick={() => {
            if (confirmaEliminar) eliminar.mutate(votacion.id, { onSuccess: onCerrar })
            else setConfirmaEliminar(true)
          }}
        >
          {confirmaEliminar ? 'Sí, borrar la votación' : 'Borrar votación'}
        </Button>
        {confirmaEliminar && <p className="text-meta text-tinta-suave">Se borra para todo el grupo, con sus votos.</p>}
      </div>
    </form>
  )
}
