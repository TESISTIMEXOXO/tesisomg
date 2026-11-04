import { FormularioCodigo } from './FormularioCodigo'

/** La página para sumarse con código. Desde la barra de arriba, el mismo formulario se abre en una ventana. */
export function Unirse() {
  return (
    <FormularioCodigo
      className="gap-8 pt-6"
      encabezado={
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display font-black">Unirse a un viaje</h1>
          <p className="text-cuerpo-lg text-tinta-suave">Poné el código que te pasaron. Antes de sumarte, ves a qué viaje entrás.</p>
        </div>
      }
    />
  )
}
