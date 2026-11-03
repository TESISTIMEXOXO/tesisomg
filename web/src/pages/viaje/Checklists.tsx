import { Check, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AvatarStack } from '../../components/ui/AvatarStack'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Despliegue } from '../../components/ui/Despliegue'
import { TextField } from '../../components/ui/TextField'
import { useAgregarItem, useBorrarItem, useBorrarLista, useCrearLista, useEditarLista, useListas, useMarcarItem } from '../../hooks/listas'
import { conMayuscula } from '../../lib/texto'
import { FONDO, FONDO_DESTACADO } from '../../pinz/tonos'
import { COLORES_LISTA, type ColorLista, type Lista, type NuevaLista } from '../../types/lista'
import type { Persona } from '../../types/persona'
import type { Etapa } from '../../types/viaje'
import { nombreEnElGrupo } from './nombres'

function quienesParticipan(lista: Lista, personas: Persona[]) {
  if (!lista.grupal) return 'Solo vos'
  const nombres = personas.filter((persona) => lista.participantes.includes(persona.id)).map((persona) => (persona.esVos ? 'vos' : persona.nombre))
  if (nombres.length === 1) return 'Solo vos, por ahora'
  return nombres.length === personas.length ? 'Todo el grupo' : conMayuscula(`${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`)
}

function CrearLista({ viajeId, personas, etapa, onListo }: { viajeId: string; personas: Persona[]; etapa: Etapa; onListo: () => void }) {
  const crear = useCrearLista(viajeId)
  return (
    <FormularioLista
      personas={personas}
      etapa={etapa}
      textoBoton="Crear checklist"
      guardando={crear.isPending}
      fallo={crear.isError}
      onCancelar={onListo}
      onGuardar={(datos) => crear.mutate(datos, { onSuccess: onListo })}
    />
  )
}

function EditarLista({ lista, personas, etapa, onListo }: { lista: Lista; personas: Persona[]; etapa: Etapa; onListo: () => void }) {
  const editar = useEditarLista(lista.viajeId, lista.id)
  return (
    <FormularioLista
      lista={lista}
      personas={personas}
      etapa={etapa}
      textoBoton="Guardar cambios"
      guardando={editar.isPending}
      fallo={editar.isError}
      onCancelar={onListo}
      onGuardar={({ nombre, color, grupal, participantes }) => editar.mutate({ nombre, color, grupal, participantes }, { onSuccess: onListo })}
    />
  )
}

type PropsFormulario = {
  /** La lista que se edita. Sin lista, se crea una; los ítems de una lista existente se cambian en la propia lista. */
  lista?: Lista
  personas: Persona[]
  etapa: Etapa
  textoBoton: string
  guardando: boolean
  fallo: boolean
  onCancelar: () => void
  onGuardar: (datos: NuevaLista) => void
}

function FormularioLista({ lista, personas, etapa, textoBoton, guardando, fallo, onCancelar, onGuardar }: PropsFormulario) {
  const yo = personas.find((persona) => persona.esVos)?.id ?? ''
  const creadoraId = lista?.creadaPorId ?? yo
  const [nombre, setNombre] = useState(lista?.nombre ?? '')
  const [grupal, setGrupal] = useState(lista?.grupal ?? false)
  const [participantes, setParticipantes] = useState(() => (lista?.grupal ? lista.participantes : personas.map((persona) => persona.id)))
  const [color, setColor] = useState<ColorLista>(lista?.color ?? 'sol')
  const [items, setItems] = useState<string[]>([])
  const [item, setItem] = useState('')
  const [errorNombre, setErrorNombre] = useState<string>()

  function sumarItem() {
    if (!item.trim()) return
    setItems((actuales) => [...actuales, item.trim()])
    setItem('')
  }

  function alEscribirItem(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    sumarItem()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nombre.trim()) {
      setErrorNombre('Ponele un nombre a la checklist.')
      return
    }
    setErrorNombre(undefined)
    // Lo que quedó escrito sin tocar "Sumar" también entra.
    const todos = item.trim() ? [...items, item.trim()] : items
    onGuardar({ nombre, color, grupal, participantes: grupal ? participantes : [yo], items: todos })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5 rounded-lg trazo bg-papel-hundido p-5">
      <TextField label="Nombre de la checklist" placeholder="Playa, documentos, auto…" value={nombre} error={errorNombre} onChange={(evento) => setNombre(evento.target.value)} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-etiqueta">¿Quiénes participan?</legend>
        <div className="flex gap-2">
          {creadoraId === yo && (
            <Chip tone={etapa} selected={!grupal} onClick={() => setGrupal(false)}>
              Solo yo
            </Chip>
          )}
          <Chip tone={etapa} selected={grupal} onClick={() => setGrupal(true)}>
            Grupal
          </Chip>
        </div>
        {grupal &&
          personas.map((persona) => (
            <label key={persona.id} className="flex min-h-toque items-center gap-2">
              <input
                type="checkbox"
                checked={persona.id === creadoraId || participantes.includes(persona.id)}
                disabled={persona.id === creadoraId}
                onChange={(evento) =>
                  setParticipantes((actuales) => (evento.target.checked ? [...actuales, persona.id] : actuales.filter((id) => id !== persona.id)))
                }
              />
              {persona.nombre}
              {persona.esVos ? ' (vos)' : ''}
            </label>
          ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-etiqueta">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES_LISTA.map(({ id, nombre: nombreColor }) => (
            <label key={id} className="relative grid size-11 cursor-pointer place-items-center">
              <input type="radio" name="color-lista" aria-label={nombreColor} checked={color === id} onChange={() => setColor(id)} className="peer sr-only" />
              <span aria-hidden className={`tema-claro grid size-9 place-items-center rounded-full trazo peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 ${FONDO[id]}`}>
                {color === id && <Check size={18} strokeWidth={3} />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!lista && <div className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <TextField label="Ítems" placeholder="Protector solar" value={item} onChange={(evento) => setItem(evento.target.value)} onKeyDown={alEscribirItem} className="flex-1" />
          <Button variant="secundario" onClick={sumarItem}>
            Sumar
          </Button>
        </div>
        {items.length > 0 && (
          <ul aria-label="Ítems de la lista nueva" className="flex flex-col">
            {items.map((actual, indice) => (
              <li key={`${actual}-${indice}`} className="flex min-h-toque items-center justify-between gap-3 border-b border-linea last:border-b-0">
                {actual}
                <Button variant="fantasma" size="sm" icon={X} aria-label={`Quitar ${actual}`} onClick={() => setItems((actuales) => actuales.filter((_, i) => i !== indice))} />
              </li>
            ))}
          </ul>
        )}
      </div>}

      {fallo && <p role="alert" className="font-semibold text-negativo">No pudimos guardar la checklist. Revisá la conexión y probá de nuevo.</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="secundario" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </Button>
        <Button variant="fantasma" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function Items({ lista, personas, editable }: { lista: Lista; personas: Persona[]; editable: boolean }) {
  const marcar = useMarcarItem(lista.viajeId, lista.id)
  const borrar = useBorrarItem(lista.viajeId, lista.id)
  if (lista.items.length === 0) return <p className="text-tinta-suave">Todavía no hay nada en esta lista.</p>
  return (
    <ul className="flex flex-col">
      {lista.items.map((item) => {
        const responsable = nombreEnElGrupo(personas, item.responsableId)
        return (
          <li key={item.id} className="flex items-center gap-2 border-b border-linea last:border-b-0">
            <label className="flex min-h-toque flex-1 cursor-pointer items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.hecha}
                disabled={!editable || marcar.isPending}
                onChange={(evento) => marcar.mutate({ itemId: item.id, hecha: evento.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="grid size-6 flex-none place-items-center rounded-sm trazo bg-papel-elevado peer-checked:bg-tinta peer-checked:text-papel peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3"
              >
                {item.hecha && <Check size={16} strokeWidth={2} />}
              </span>
              <span className={`flex-1 ${item.hecha ? 'text-tinta-suave line-through' : ''}`}>{item.titulo}</span>
              {responsable && <b className="text-meta">{conMayuscula(responsable)}</b>}
            </label>
            {editable && <Button variant="fantasma" size="sm" icon={X} aria-label={`Borrar ${item.titulo}`} disabled={borrar.isPending} onClick={() => borrar.mutate(item.id)} />}
          </li>
        )
      })}
    </ul>
  )
}

function AgregarItem({ lista }: { lista: Lista }) {
  const agregar = useAgregarItem(lista.viajeId, lista.id)
  const [titulo, setTitulo] = useState('')

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (titulo.trim()) agregar.mutate(titulo, { onSuccess: () => setTitulo('') })
  }

  return (
    <form onSubmit={enviar} noValidate className="flex items-end gap-3">
      <TextField label="Nuevo ítem" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} className="flex-1" />
      <Button type="submit" variant="secundario" disabled={agregar.isPending}>
        Agregar
      </Button>
    </form>
  )
}

function TarjetaLista({ lista, personas, etapa, editable, puedeBorrar }: { lista: Lista; personas: Persona[]; etapa: Etapa; editable: boolean; puedeBorrar: boolean }) {
  const borrar = useBorrarLista(lista.viajeId)
  const [abierta, setAbierta] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmaBorrar, setConfirmaBorrar] = useState(false)
  const idContenido = useId()
  const hechas = lista.items.filter((item) => item.hecha).length
  const gente = personas.filter((persona) => lista.participantes.includes(persona.id)).map((persona) => ({ name: persona.nombre, pinz: persona.pinz }))

  return (
    <article className="overflow-hidden rounded-lg trazo bg-papel-elevado shadow-grande">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idContenido}
        onClick={() => setAbierta((actual) => !actual)}
        className={`flex w-full items-center gap-3 p-4 text-left select-none ${FONDO_DESTACADO[lista.color]}`}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-display text-titulo-2 font-black">{lista.nombre}</span>
          <span className="flex min-w-0 items-center gap-2">
            <AvatarStack people={gente} max={4} />
            <span className="text-meta font-bold">{quienesParticipan(lista, personas)}</span>
          </span>
        </span>
        <span className="font-display text-titulo-2 font-black numeros">{hechas}/{lista.items.length}</span>
        <ChevronDown
          size={22}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`}
        />
      </button>
      <Despliegue abierta={abierta} id={idContenido}>
        <div className="flex flex-col gap-4 trazo-t p-4">
          <Items lista={lista} personas={personas} editable={editable} />
          {editable && <AgregarItem lista={lista} />}
          {editando && <EditarLista lista={lista} personas={personas} etapa={etapa} onListo={() => setEditando(false)} />}
          {!editando && (
            <div className="flex flex-wrap gap-2">
              {editable && (
                <Button variant="fantasma" size="sm" icon={Pencil} onClick={() => setEditando(true)}>
                  Editar lista
                </Button>
              )}
              {puedeBorrar && (
                <Button
                  variant="fantasma"
                  size="sm"
                  icon={Trash2}
                  disabled={borrar.isPending}
                  onClick={() => {
                    if (confirmaBorrar) borrar.mutate(lista.id)
                    else setConfirmaBorrar(true)
                  }}
                >
                  {confirmaBorrar ? 'Sí, borrar la lista' : 'Borrar lista'}
                </Button>
              )}
            </div>
          )}
          {borrar.isError && <p role="alert" className="font-semibold text-negativo">No pudimos borrar la lista.</p>}
        </div>
      </Despliegue>
    </article>
  )
}

/** Checklist: todas las checklists de quien mira, personales y grupales, cada una con su nombre y su color. */
export function Checklists({ viajeId, personas, etapa, editable }: { viajeId: string; personas: Persona[]; etapa: Etapa; editable: boolean }) {
  const listas = useListas(viajeId)
  const [creando, setCreando] = useState(false)
  const yo = personas.find((persona) => persona.esVos)

  return (
    <section aria-labelledby="checklist" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="checklist" className="font-display text-titulo-1 font-black lg:text-display">Checklist</h2>
        {editable && !creando && (
          <Button variant="secundario" icon={Plus} onClick={() => setCreando(true)}>
            Crear
          </Button>
        )}
      </div>
      {creando && <CrearLista viajeId={viajeId} personas={personas} etapa={etapa} onListo={() => setCreando(false)} />}
      {listas.isPending && <p className="text-tinta-suave">Cargando las listas…</p>}
      {listas.error && <p role="alert" className="text-negativo">No pudimos cargar las listas.</p>}
      {listas.data?.length === 0 && !creando && <p className="text-tinta-suave">Todavía no hay listas. Creá la primera: playa, documentos, auto.</p>}
      {listas.data && listas.data.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {listas.data.map((lista) => (
            <TarjetaLista
              key={lista.id}
              lista={lista}
              personas={personas}
              etapa={etapa}
              editable={editable}
              puedeBorrar={editable && (lista.creadaPorId === yo?.id || yo?.rol === 'organizador')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
