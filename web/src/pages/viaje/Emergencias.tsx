import { ExternalLink, LocateFixed, MapPin, Phone, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { useUbicacionActual } from '../../hooks/ubicacion'
import { useEmergencias, usePaisEn } from '../../hooks/viajes'
import { useViajeActual } from '../../layouts/contextoViaje'
import { GUARDIA_CANCILLERIA, HORARIO_GUARDIA_CANCILLERIA, PAISES, type InfoPais } from '../../lib/paises'

/** Los contactos que se cargan solos al crear un viaje: son los de Argentina y los reemplaza el país donde estás. */
const CONTACTOS_DE_FABRICA = new Set(['policia', 'medicas', 'bomberos'])

const PAISES_ORDENADOS = Object.values(PAISES).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

/** Emergencias: serio y directo. Es la única pantalla del viaje que nunca lleva pinz. */
export function Emergencias() {
  const { viaje } = useViajeActual()
  const { data, isPending, error, refetch } = useEmergencias(viaje.id)
  const ubicacion = useUbicacionActual()
  const [paisElegido, setPaisElegido] = useState<string | null>(null)

  // Sin permiso de ubicación, se usa el destino del viaje.
  const sinUbicacion = ubicacion.estado === 'denegada' || ubicacion.estado === 'no-disponible'
  const coordenadas = ubicacion.estado === 'ok' ? ubicacion : sinUbicacion ? viaje.ubicacion : null
  const pais = usePaisEn(coordenadas)

  const codigo = paisElegido ?? pais.data?.codigo ?? null
  const info = codigo ? PAISES[codigo] ?? null : null
  const nombrePais = info?.nombre ?? pais.data?.nombre ?? null
  const principal = info?.telefonos[0]?.telefono ?? '112'

  return (
    <div className="flex max-w-180 flex-col gap-6">
      <h2 className="font-display text-display font-black">Emergencias</h2>

      <section aria-live="polite" className="flex flex-col gap-3 rounded-lg trazo bg-papel-hundido p-4">
        <p className="flex items-start gap-2">
          <LocateFixed size={20} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            {paisElegido
              ? `Mostrando ${nombrePais}, el país que elegiste.`
              : ubicacion.estado === 'buscando'
                ? 'Buscando dónde estás…'
                : pais.isPending && coordenadas
                  ? 'Viendo en qué país estás…'
                  : nombrePais
                    ? ubicacion.estado === 'ok'
                      ? `Estás en ${nombrePais}. Se actualiza solo mientras tengas esta pantalla abierta.`
                      : `No tenemos tu ubicación: mostramos ${nombrePais}, el destino del viaje.`
                    : sinUbicacion
                      ? 'No tenemos tu ubicación. Elegí el país donde estás.'
                      : 'No pudimos saber en qué país estás. Elegí el país donde estás.'}
          </span>
        </p>
        {ubicacion.estado === 'denegada' && (
          <p className="text-meta text-tinta-suave">Para que se actualice solo, permití la ubicación en el navegador.</p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-etiqueta">{codigo ? '¿No es este país?' : 'País'}</span>
          <select
            value={paisElegido ?? ''}
            onChange={(evento) => setPaisElegido(evento.target.value || null)}
            className="min-h-control rounded-md trazo bg-papel-elevado px-3"
          >
            <option value="">{ubicacion.estado === 'ok' ? 'Según mi ubicación' : 'Según el destino del viaje'}</option>
            {PAISES_ORDENADOS.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </section>

      {info ? (
        <InfoDelPais info={info} />
      ) : (
        <ul className="flex flex-col gap-3">
          <ContactoLlamable
            nombre="Emergencias"
            detalle={
              nombrePais
                ? `No tenemos los números de ${nombrePais}. El 112 funciona desde casi cualquier celular del mundo.`
                : 'El 112 funciona desde casi cualquier celular del mundo, aun sin chip.'
            }
            telefono="112"
          />
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-lg trazo bg-papel-elevado p-4">
        <h3 className="text-sobretitulo uppercase">Cancillería argentina</h3>
        <p>
          Si tenés una emergencia fuera del país y no podés comunicarte con la embajada, llamá a la guardia de Cancillería. Atiende{' '}
          {HORARIO_GUARDIA_CANCILLERIA}.
        </p>
        <a href={`tel:${GUARDIA_CANCILLERIA.replace(/[\s-]/g, '')}`} className={`${estilosBoton('secundario', 'md')} self-start`}>
          <Phone size={20} strokeWidth={2} aria-hidden />
          {GUARDIA_CANCILLERIA}
        </a>
      </section>

      {isPending && <p role="status">Cargando los datos del viaje…</p>}
      {error && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg trazo bg-papel-elevado p-5">
          <p className="font-bold">No pudimos cargar los contactos del viaje. Si es urgente, llamá al {principal}.</p>
          <button type="button" onClick={() => refetch()} className={estilosBoton('secundario', 'sm')}>
            Probar de nuevo
          </button>
        </div>
      )}
      {data && (
        <>
          {data.contactos.some((contacto) => !CONTACTOS_DE_FABRICA.has(contacto.id)) && (
            <section className="flex flex-col gap-3">
              <h3 className="text-sobretitulo uppercase">Contactos del viaje</h3>
              <ul className="flex flex-col gap-3">
                {data.contactos
                  .filter((contacto) => !CONTACTOS_DE_FABRICA.has(contacto.id))
                  .map((contacto) => (
                    <ContactoLlamable key={contacto.id} {...contacto} />
                  ))}
              </ul>
            </section>
          )}
          {data.alojamiento.nombre && (
            <section className="flex flex-col gap-1 rounded-lg trazo bg-papel-hundido p-4">
              <h3 className="text-sobretitulo uppercase">Dónde duermen</h3>
              <p className="text-titulo-2">{data.alojamiento.nombre}</p>
              <p>{data.alojamiento.direccion}</p>
              {data.alojamiento.direccionLocal && <p lang="und">{data.alojamiento.direccionLocal}</p>}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function InfoDelPais({ info }: { info: InfoPais }) {
  const { embajada } = info
  return (
    <>
      <ul className="flex flex-col gap-3">
        {info.telefonos.map((telefono) => (
          <ContactoLlamable key={telefono.id} {...telefono} />
        ))}
      </ul>

      {embajada && (
        <section className="flex flex-col gap-3 rounded-lg trazo bg-papel-elevado p-4 shadow-dura">
          <h3 className="text-sobretitulo uppercase">Embajada argentina en {info.nombre}</h3>
          <div className="flex flex-col">
            <p className="text-titulo-2">{embajada.direccion}</p>
            <p className="text-tinta-suave">{embajada.ciudad}</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
            {embajada.telefono && (
              <a href={`tel:${embajada.telefono.replace(/[\s-]/g, '')}`} className={estilosBoton('secundario', 'sm')}>
                <Phone size={18} strokeWidth={2} aria-hidden />
                {embajada.telefono}
              </a>
            )}
            {embajada.guardia && (
              <a href={`tel:${embajada.guardia.replace(/[\s-]/g, '')}`} className={estilosBoton('secundario', 'sm')}>
                <Phone size={18} strokeWidth={2} aria-hidden />
                Guardia {embajada.guardia}
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${embajada.direccion}, ${embajada.ciudad}`)}`}
              target="_blank"
              rel="noreferrer"
              className={estilosBoton('fantasma', 'sm')}
            >
              <MapPin size={18} strokeWidth={2} aria-hidden />
              Cómo llegar
            </a>
            {embajada.web && (
              <a href={embajada.web} target="_blank" rel="noreferrer" className={estilosBoton('fantasma', 'sm')}>
                <ExternalLink size={18} strokeWidth={2} aria-hidden />
                Sitio web
              </a>
            )}
          </div>
        </section>
      )}

      {info.precauciones.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg trazo bg-papel-hundido p-4">
          <h3 className="text-sobretitulo uppercase">Precauciones en {info.nombre}</h3>
          <ul className="flex flex-col gap-2">
            {info.precauciones.map((precaucion) => (
              <li key={precaucion} className="flex items-start gap-2">
                <TriangleAlert size={18} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
                <span>{precaucion}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function ContactoLlamable({ nombre, detalle, telefono }: { nombre: string; detalle: string; telefono: string | null }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg trazo bg-papel-elevado p-4 shadow-dura md:flex-row md:items-center">
      <div className="flex flex-1 flex-col">
        <span className="text-titulo-2">{nombre}</span>
        <span className="text-tinta-suave">{detalle}</span>
      </div>
      {telefono ? (
        <a href={`tel:${telefono.replace(/[\s-]/g, '')}`} className={estilosBoton('emergencia', 'md')}>
          <Phone size={20} strokeWidth={2} aria-hidden />
          Llamar al {telefono}
        </a>
      ) : (
        <span className="text-meta text-tinta-suave">Sin teléfono cargado</span>
      )}
    </li>
  )
}
