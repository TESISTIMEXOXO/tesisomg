import { Cargando, NoCargo } from '../../components/marca/Estados'
import { TituloPantalla } from '../../components/marca/TituloPantalla'
import { ArchivosSlot } from '../../components/slots/ArchivosSlot'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { useAbrirDocumento, useDocumentos, useSubirDocumento } from '../../hooks/baul'
import { useViajeActual } from '../../layouts/contextoViaje'

/** Baúl: lo que el grupo guarda para tener a mano. */
export function Baul() {
  const { viaje } = useViajeActual()
  const documentos = useDocumentos(viaje.id)
  const subir = useSubirDocumento(viaje.id)
  const abrir = useAbrirDocumento()

  if (documentos.isPending) return <Cargando pinz="postal" />
  if (documentos.error) return <NoCargo error={documentos.error} onReintentar={() => documentos.refetch()} />

  return (
    <>
      <TituloPantalla titulo="Todo guardado" pinz="postal" />
      <Tarjeta titulo="Papeles">
        <ArchivosSlot
          archivos={documentos.data.filter((documento) => !documento.personal)}
          onSubir={(archivo) => subir.mutate(archivo)}
          onAbrir={(id) => abrir.mutate(id)}
        />
      </Tarjeta>
    </>
  )
}
