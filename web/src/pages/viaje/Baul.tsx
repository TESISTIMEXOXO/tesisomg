import { Check, Siren } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Cargando, NoCargo } from '../../components/marca/Estados'
import { ArchivosSlot } from '../../components/slots/ArchivosSlot'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { TextField } from '../../components/ui/TextField'
import { useAbrirDocumento, useAgregarTarea, useDocumentos, useMarcarTarea, useRequisitos, useSubirDocumento, useTareas } from '../../hooks/baul'
import { useViajeActual } from '../../layouts/contextoViaje'
import { conMayuscula } from '../../lib/texto'
import type { Persona } from '../../types/persona'
import type { Tarea } from '../../types/tarea'
import { nombreEnElGrupo, puedeEditar } from './nombres'

function ListaDeTareas({ tareas, personas, viajeId, editable }: { tareas: Tarea[]; personas: Persona[]; viajeId: string; editable: boolean }) {
  const marcar = useMarcarTarea(viajeId)
  if (tareas.length === 0) return <p className="text-tinta-suave">No hay nada anotado todavía.</p>
  return (
    <ul className="flex flex-col">
      {tareas.map((tarea) => {
        const responsable = nombreEnElGrupo(personas, tarea.responsableId)
        return (
          <li key={tarea.id} className="border-b border-linea last:border-b-0">
            <label className="flex min-h-toque cursor-pointer items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={tarea.hecha}
                disabled={!editable || marcar.isPending}
                onChange={(evento) => marcar.mutate({ tareaId: tarea.id, hecha: evento.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="grid size-6 flex-none place-items-center rounded-sm trazo bg-papel-elevado peer-checked:bg-tinta peer-checked:text-papel peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3"
              >
                {tarea.hecha && <Check size={16} strokeWidth={2} />}
              </span>
              <span className={`flex-1 ${tarea.hecha ? 'text-tinta-suave line-through' : ''}`}>{tarea.titulo}</span>
              {responsable && <b className="text-meta">{conMayuscula(responsable)}</b>}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function AgregarTarea({ viajeId, lista }: { viajeId: string; lista: Tarea['lista'] }) {
  const agregar = useAgregarTarea(viajeId)
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!titulo.trim()) {
      setError('Contanos qué hay que hacer.')
      return
    }
    setError(undefined)
    agregar.mutate({ titulo, lista, responsableId: null }, { onSuccess: () => setTitulo('') })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 md:flex-row md:items-end">
      <TextField label="Nuevo ítem" value={titulo} error={error} onChange={(evento) => setTitulo(evento.target.value)} className="flex-1" />
      <Button type="submit" variant="secundario" disabled={agregar.isPending}>
        Agregar
      </Button>
    </form>
  )
}

/** Baúl: checklist, tareas con responsable, requisitos y documentos. */
export function Baul() {
  const { viaje, etapa } = useViajeActual()
  const tareas = useTareas(viaje.id)
  const requisitos = useRequisitos(viaje.id)
  const documentos = useDocumentos(viaje.id)
  const subir = useSubirDocumento(viaje.id)
  const abrir = useAbrirDocumento()
  const [lista, setLista] = useState<Tarea['lista']>('compartida')
  const editable = puedeEditar(viaje.personas)

  if (tareas.isPending) return <Cargando pinz="valija" />
  if (tareas.error) return <NoCargo error={tareas.error} onReintentar={() => tareas.refetch()} />

  const visibles = tareas.data.filter((t) => t.lista === lista)
  const documentosDelViaje = (documentos.data ?? []).filter((d) => !d.personal)

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-7">
      <Tarjeta titulo="Checklist">
        <div className="flex gap-2" role="group" aria-label="Qué lista ver">
          <Chip tone={etapa} selected={lista === 'compartida'} onClick={() => setLista('compartida')}>
            Del grupo
          </Chip>
          <Chip tone={etapa} selected={lista === 'personal'} onClick={() => setLista('personal')}>
            Mía
          </Chip>
        </div>
        <ListaDeTareas tareas={visibles} personas={viaje.personas} viajeId={viaje.id} editable={editable} />
        {editable && <AgregarTarea viajeId={viaje.id} lista={lista} />}
      </Tarjeta>

      <div className="flex flex-col gap-8 lg:gap-7">
        <Tarjeta titulo="Requisitos">
          {requisitos.isPending && <p className="text-tinta-suave">Cargando los requisitos…</p>}
          {requisitos.error && <p className="text-negativo">No pudimos cargar los requisitos.</p>}
          <ul className="flex flex-col gap-2.5">
            {requisitos.data?.map((requisito) => (
              <li key={requisito.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid size-6 flex-none place-items-center rounded-full trazo-fino ${requisito.cumplido ? 'tema-claro bg-mar' : 'bg-papel-elevado'}`}
                >
                  {requisito.cumplido && <Check size={14} strokeWidth={2} aria-hidden />}
                </span>
                <span className="flex flex-col">
                  <span className="font-bold">
                    {requisito.titulo}
                    <span className="sr-only">{requisito.cumplido ? ', listo' : ', te falta'}</span>
                  </span>
                  <span className="text-meta text-tinta-suave">{requisito.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Documentos">
          {documentos.error && <p className="text-negativo">No pudimos cargar los documentos.</p>}
          {documentos.data && (
            <ArchivosSlot archivos={documentosDelViaje} onSubir={(archivo) => subir.mutate(archivo)} onAbrir={(id) => abrir.mutate(id)} />
          )}
        </Tarjeta>

        {etapa !== 'viaje' && (
          <ButtonLink to={`/viajes/${viaje.id}/emergencias`} variant="secundario" icon={Siren} className="self-start">
            Datos de emergencia
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
