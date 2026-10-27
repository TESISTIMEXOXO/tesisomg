import { Phone } from 'lucide-react'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { useEmergencias } from '../../hooks/viajes'
import { useViajeActual } from '../../layouts/contextoViaje'

/** Emergencias: serio y directo. Es la única pantalla del viaje que nunca lleva pinz. */
export function Emergencias() {
  const { viaje } = useViajeActual()
  const { data, isPending, error, refetch } = useEmergencias(viaje.id)

  return (
    <div className="flex max-w-180 flex-col gap-6">
      <h2 className="font-display text-display font-black">Emergencias</h2>
      {isPending && <p role="status">Cargando los datos de emergencia…</p>}
      {error && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg trazo bg-papel-elevado p-5">
          <p className="font-bold">No pudimos cargar los datos de emergencia. Si es urgente, llamá al 911.</p>
          <button type="button" onClick={() => refetch()} className={estilosBoton('secundario', 'sm')}>
            Probar de nuevo
          </button>
        </div>
      )}
      {data && (
        <>
          <ul className="flex flex-col gap-3">
            {data.contactos.map((contacto) => (
              <li key={contacto.id} className="flex flex-col gap-3 rounded-lg trazo bg-papel-elevado p-4 shadow-dura md:flex-row md:items-center">
                <div className="flex flex-1 flex-col">
                  <span className="text-titulo-2">{contacto.nombre}</span>
                  <span className="text-tinta-suave">{contacto.detalle}</span>
                </div>
                {contacto.telefono ? (
                  <a href={`tel:${contacto.telefono}`} className={estilosBoton('emergencia', 'md')}>
                    <Phone size={20} strokeWidth={2} aria-hidden />
                    Llamar al {contacto.telefono}
                  </a>
                ) : (
                  <span className="text-meta text-tinta-suave">Sin teléfono cargado</span>
                )}
              </li>
            ))}
          </ul>
          <section className="flex flex-col gap-1 rounded-lg trazo bg-papel-hundido p-4">
            <h3 className="text-sobretitulo uppercase">Dónde duermen</h3>
            <p className="text-titulo-2">{data.alojamiento.nombre}</p>
            <p>{data.alojamiento.direccion}</p>
            {data.alojamiento.direccionLocal && <p lang="und">{data.alojamiento.direccionLocal}</p>}
          </section>
        </>
      )}
    </div>
  )
}
