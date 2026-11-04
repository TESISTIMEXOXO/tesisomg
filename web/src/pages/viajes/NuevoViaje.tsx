import { FormularioViaje } from './FormularioViaje'

/** La página para armar un viaje, con la vista previa al lado. Desde la barra de arriba, el mismo formulario se abre en una ventana. */
export function NuevoViaje() {
  return <FormularioViaje conVistaPrevia encabezado={<h1 className="font-display text-display font-black">Armar un viaje</h1>} />
}
