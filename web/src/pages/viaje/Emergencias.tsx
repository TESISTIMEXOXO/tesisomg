import { ChevronDown, ExternalLink, LocateFixed, MapPin, Phone, TriangleAlert } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Despliegue } from '../../components/ui/Despliegue'
import { estilosBoton } from '../../components/ui/estilosBoton'
import { useUbicacionActual } from '../../hooks/ubicacion'
import { useEmergencias, usePaisEn } from '../../hooks/viajes'
import { useViajeActual } from '../../layouts/contextoViaje'
import { GUARDIA_CANCILLERIA, HORARIO_GUARDIA_CANCILLERIA, PAISES, type InfoPais } from '../../lib/paises'

/** Los contactos que se cargan solos al crear un viaje: son los de Argentina y los reemplaza el país donde estás. */
const CONTACTOS_DE_FABRICA = new Set(['policia', 'medicas', 'bomberos'])

const PAISES_ORDENADOS = Object.values(PAISES).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

const LISTA_CONTACTOS = 'flex flex-col divide-y divide-linea rounded-lg trazo bg-papel-elevado shadow-dura'

/** Emergencias: serio y directo. Es la única pantalla del viaje que nunca lleva pinz. Llamar nunca queda plegado. */
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
  const contactosDelViaje = data?.contactos.filter((contacto) => !CONTACTOS_DE_FABRICA.has(contacto.id)) ?? []

  return (
    <div className="flex max-w-180 flex-col gap-4">
      <h2 className="font-display text-display font-black">Emergencias</h2>

      <section aria-live="polite" className="flex flex-col gap-2">
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
                      ? `Estás en ${nombrePais}.`
                      : `No tenemos tu ubicación: mostramos ${nombrePais}, el destino del viaje.`
                    : sinUbicacion
                      ? 'No tenemos tu ubicación. Elegí el país donde estás.'
                      : 'No pudimos saber en qué país estás. Elegí el país donde estás.'}
          </span>
        </p>
        <label className="flex items-center gap-2">
          <span className="text-etiqueta whitespace-nowrap">{codigo ? '¿Otro país?' : 'País'}</span>
          <select
            value={paisElegido ?? ''}
            onChange={(evento) => setPaisElegido(evento.target.value || null)}
            className="min-h-toque min-w-0 flex-1 rounded-md trazo bg-papel-elevado px-3"
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
        <ul aria-label={`Números de emergencia en ${info.nombre}`} className={LISTA_CONTACTOS}>
          {info.telefonos.map((telefono) => (
            <ContactoLlamable key={telefono.id} {...telefono} />
          ))}
        </ul>
      ) : (
        <ul className={LISTA_CONTACTOS}>
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

      {contactosDelViaje.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sobretitulo uppercase">Contactos del viaje</h3>
          <ul className={LISTA_CONTACTOS}>
            {contactosDelViaje.map((contacto) => (
              <ContactoLlamable key={contacto.id} {...contacto} />
            ))}
          </ul>
        </section>
      )}

      {data?.alojamiento.nombre && (
        <section className="flex flex-col gap-1 rounded-lg trazo bg-papel-hundido p-4">
          <h3 className="text-sobretitulo uppercase">Dónde duermen</h3>
          <p className="text-titulo-2">{data.alojamiento.nombre}</p>
          <p>{data.alojamiento.direccion}</p>
          {data.alojamiento.direccionLocal && <p lang="und">{data.alojamiento.direccionLocal}</p>}
        </section>
      )}

      {isPending && <p role="status">Cargando los datos del viaje…</p>}
      {error && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg trazo bg-papel-elevado p-5">
          <p className="font-bold">No pudimos cargar los contactos del viaje. Si es urgente, llamá al {principal}.</p>
          <button type="button" onClick={() => refetch()} className={estilosBoton('secundario', 'sm')}>
            Probar de nuevo
          </button>
        </div>
      )}

      {info?.embajada && <SeccionEmbajada info={info} />}
      {info && info.precauciones.length > 0 && (
        <Plegable titulo={`Precauciones en ${info.nombre}`}>
          <ul className="flex flex-col gap-2">
            {info.precauciones.map((precaucion) => (
              <li key={precaucion} className="flex items-start gap-2">
                <TriangleAlert size={18} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
                <span>{precaucion}</span>
              </li>
            ))}
          </ul>
        </Plegable>
      )}
      <Plegable titulo="Cancillería argentina">
        <p>
          Si tenés una emergencia fuera del país y no podés comunicarte con la embajada, llamá a la guardia de Cancillería. Atiende{' '}
          {HORARIO_GUARDIA_CANCILLERIA}.
        </p>
        <a href={`tel:${GUARDIA_CANCILLERIA.replace(/[\s-]/g, '')}`} className={`${estilosBoton('secundario', 'md')} self-start`}>
          <Phone size={20} strokeWidth={2} aria-hidden />
          {GUARDIA_CANCILLERIA}
        </a>
      </Plegable>
    </div>
  )
}

function Plegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const idContenido = useId()
  return (
    <section className="rounded-lg trazo bg-papel-elevado shadow-dura">
      <h3>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idContenido}
          onClick={() => setAbierto((actual) => !actual)}
          className="flex min-h-control w-full items-center justify-between gap-3 px-4 text-left font-bold select-none"
        >
          {titulo}
          <ChevronDown
            size={20}
            strokeWidth={2}
            aria-hidden
            className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <Despliegue abierta={abierto} id={idContenido}>
        <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
      </Despliegue>
    </section>
  )
}

function SeccionEmbajada({ info }: { info: InfoPais }) {
  const { embajada } = info
  if (!embajada) return null
  return (
    <Plegable titulo={`Embajada argentina en ${info.nombre}`}>
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
    </Plegable>
  )
}

function ContactoLlamable({ nombre, detalle, telefono }: { nombre: string; detalle: string; telefono: string | null }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="font-bold">{nombre}</span>
        <span className="text-meta text-tinta-suave">{detalle}</span>
      </div>
      {telefono ? (
        <a
          href={`tel:${telefono.replace(/[\s-]/g, '')}`}
          aria-label={`Llamar al ${telefono}, ${nombre}`}
          className={`${estilosBoton('emergencia', 'sm')} shrink-0 whitespace-nowrap`}
        >
          <Phone size={18} strokeWidth={2} aria-hidden />
          {telefono}
        </a>
      ) : (
        <span className="text-meta text-tinta-suave">Sin teléfono</span>
      )}
    </li>
  )
}
