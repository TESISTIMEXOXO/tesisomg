import { Download, Share2 } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { guardarArchivo } from '../../lib/guardarArchivo'
import { Button } from './Button'
import { Ventana } from './Ventana'

type VistaArchivoProps = {
  /** El nombre se conoce antes que el archivo: la ventana se abre con él mientras el archivo llega. null = cerrada. */
  nombre: string | null
  archivo?: File
  error?: Error | null
  onReintentar?: () => void
  onClose: () => void
}

function sePuedeCompartir(archivo: File | undefined): archivo is File {
  return archivo !== undefined && typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })
}

/** Muestra un PDF o una foto adentro de la app, con la opción de bajarlo o mandarlo por otra app del dispositivo. */
export function VistaArchivo({ nombre, archivo, error, onReintentar, onClose }: VistaArchivoProps) {
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const [noSeCompartio, setNoSeCompartio] = useState(false)

  useEffect(() => {
    if (nombre !== null && !ventana.current?.open) ventana.current?.showModal()
    if (nombre === null) ventana.current?.close()
  }, [nombre])

  /* El link al archivo vive lo mismo que el elemento que lo muestra: así no queda memoria ocupada al cerrar. */
  const mostrar = useCallback(
    (elemento: HTMLImageElement | HTMLObjectElement | null) => {
      if (!elemento || !archivo) return
      const url = URL.createObjectURL(archivo)
      if (elemento instanceof HTMLImageElement) elemento.src = url
      else elemento.data = url
      return () => URL.revokeObjectURL(url)
    },
    [archivo],
  )

  async function compartir(archivo: File) {
    setNoSeCompartio(false)
    try {
      await navigator.share({ files: [archivo], title: archivo.name })
    } catch (motivo) {
      /* Cerrar el menú de compartir sin elegir nada también llega como error, y no lo es. */
      if (!(motivo instanceof DOMException && motivo.name === 'AbortError')) setNoSeCompartio(true)
    }
  }

  function cerrar() {
    setNoSeCompartio(false)
    onClose()
  }

  return (
    <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={cerrar} ancha>
      {/*
       * Los botones van antes que el archivo: showModal enfoca lo primero, y un PDF se queda con el teclado.
       * En mobile se ven abajo, a mano del pulgar; en desktop, al lado del título.
       */}
      <div className="max-md:contents md:flex md:items-center md:justify-between md:gap-3 md:pr-12">
        <h2 id={idTitulo} className="truncate pr-12 font-display text-titulo-2 md:pr-0">
          {nombre}
        </h2>
        <div className="flex gap-3 max-md:order-last max-md:mt-4">
          <Button size="sm" icon={Download} disabled={!archivo} onClick={() => archivo && guardarArchivo(archivo)} className="max-md:flex-1">
            Descargar
          </Button>
          {sePuedeCompartir(archivo) && (
            <Button size="sm" variant="secundario" icon={Share2} onClick={() => void compartir(archivo)} className="max-md:flex-1">
              Compartir
            </Button>
          )}
        </div>
      </div>
      {noSeCompartio && (
        <p role="alert" className="mt-3 text-meta text-negativo max-md:order-last">
          No se pudo compartir. Descargalo y mandalo desde tu dispositivo.
        </p>
      )}

      <div className="relative mt-4 grid min-h-0 flex-1 place-items-center overflow-hidden rounded-md trazo-fino bg-papel-hundido">
        {error ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p>No pudimos abrir el archivo. Revisá la conexión y probá de nuevo.</p>
            {onReintentar && (
              <Button size="sm" variant="secundario" onClick={onReintentar}>
                Probar de nuevo
              </Button>
            )}
          </div>
        ) : !archivo ? (
          <p role="status" className="p-6 text-tinta-suave">
            Abriendo el archivo…
          </p>
        ) : archivo.type.startsWith('image/') ? (
          <img ref={mostrar} alt={archivo.name} className="absolute inset-0 size-full object-contain" />
        ) : archivo.type === 'application/pdf' ? (
          <object ref={mostrar} type="application/pdf" aria-label={archivo.name} className="absolute inset-0 size-full">
            {/* Lo que se ve en los navegadores que no muestran PDFs adentro de una página, como Chrome en Android. */}
            <p className="p-6 text-center">Este navegador no muestra el PDF acá. Descargalo para verlo.</p>
          </object>
        ) : (
          <p className="p-6 text-center">Este tipo de archivo no se puede ver acá. Descargalo para abrirlo.</p>
        )}
      </div>
    </Ventana>
  )
}
