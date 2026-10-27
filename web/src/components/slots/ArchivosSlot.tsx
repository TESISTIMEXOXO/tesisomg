import { FileText, Upload } from 'lucide-react'
import { useId, useState, type DragEvent } from 'react'
import { tamanoDeArchivo } from '../../lib/moneda'
import type { Documento } from '../../types/documento'

export type ArchivosSlotProps = {
  archivos: Pick<Documento, 'id' | 'nombre' | 'tipo' | 'tamano'>[]
  onSubir: (archivo: File) => void
  onAbrir: (id: string) => void
  /** Qué se espera subir, para el texto de la zona de arrastre. */
  ayuda?: string
}

/**
 * Slot de archivos. El front muestra la lista y recibe el archivo; guardarlo,
 * abrirlo y dejarlo disponible sin conexión lo resuelve el backend.
 */
export function ArchivosSlot({ archivos, onSubir, onAbrir, ayuda = 'Vouchers, pasajes o seguros, en PDF o foto.' }: ArchivosSlotProps) {
  const idInput = useId()
  const [arrastrando, setArrastrando] = useState(false)

  function soltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault()
    setArrastrando(false)
    const archivo = evento.dataTransfer.files[0]
    if (archivo) onSubir(archivo)
  }

  return (
    <div className="flex flex-col gap-3">
      {archivos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {archivos.map((archivo) => (
            <li key={archivo.id}>
              <button
                type="button"
                onClick={() => onAbrir(archivo.id)}
                className="flex min-h-toque w-full items-center gap-3 rounded-md trazo bg-papel-elevado px-4 py-2.5 text-left shadow-chica"
              >
                <span aria-hidden className="grid size-9 flex-none place-items-center rounded-sm trazo-fino tema-claro bg-cielo">
                  <FileText size={20} strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-bold">{archivo.nombre}</span>
                  <span className="text-meta text-tinta-suave">{tamanoDeArchivo(archivo.tamano)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <label
        htmlFor={idInput}
        onDragOver={(evento) => {
          evento.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
        className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-4 text-center has-focus-visible:outline-3 has-focus-visible:outline-offset-3 ${
          arrastrando ? 'bg-cielo-tinte' : 'bg-papel-elevado'
        }`}
      >
        <Upload size={20} strokeWidth={2} aria-hidden />
        <span className="text-etiqueta">Subir un archivo</span>
        <span className="text-meta text-tinta-suave">Arrastralo acá o tocá para elegirlo. {ayuda}</span>
        <input
          id={idInput}
          type="file"
          className="sr-only"
          onChange={(evento) => {
            const archivo = evento.target.files?.[0]
            if (archivo) onSubir(archivo)
            evento.target.value = ''
          }}
        />
      </label>
    </div>
  )
}
