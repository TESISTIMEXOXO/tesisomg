import { ChevronRight } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Ventana } from '../../components/ui/Ventana'
import { useEnviarConsulta } from '../../hooks/contacto'
import { codigoDeError } from '../../services/auth'
import { ConsultaSchema } from '../../types/contacto'

type Errores = Partial<Record<'email' | 'asunto' | 'descripcion', string>>

type FormularioContactoProps = {
  /** En el pie va como un link más de la lista; en Preguntas, como botón. */
  comoLink?: string
}

/** El botón "Escribinos" y la ventana con el formulario. La consulta queda guardada y a la persona le llega un mail. */
export function FormularioContacto({ comoLink }: FormularioContactoProps) {
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()
  const enviar = useEnviarConsulta()
  const [email, setEmail] = useState('')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState<Errores>({})

  function abrir() {
    ventana.current?.showModal()
  }

  function cerrar() {
    ventana.current?.close()
  }

  /* Al cerrar después de enviar, la próxima vez arranca vacío. Si no se envió, se conserva lo escrito. */
  function alCerrar() {
    if (!enviar.isSuccess) return
    setAsunto('')
    setDescripcion('')
    enviar.reset()
  }

  function mandar(evento: FormEvent) {
    evento.preventDefault()
    const datos = ConsultaSchema.safeParse({ email, asunto, descripcion })
    if (!datos.success) {
      const nuevos: Errores = {}
      for (const issue of datos.error.issues) {
        const campo = issue.path[0] as keyof Errores
        nuevos[campo] ??= issue.message
      }
      setErrores(nuevos)
      return
    }
    setErrores({})
    enviar.mutate(datos.data)
  }

  const errorEnvio =
    codigoDeError(enviar.error) === 'demasiadas-consultas'
      ? 'Ya recibimos varias consultas tuyas en la última hora. Esperá un rato y probá de nuevo.'
      : 'No pudimos mandar la consulta. Revisá la conexión y probá de nuevo.'

  return (
    <>
      {comoLink ? (
        <button type="button" className={comoLink} onClick={abrir}>
          Escribinos
        </button>
      ) : (
        <Button variant="secundario" iconRight={ChevronRight} onClick={abrir}>
          Escribinos
        </Button>
      )}
      <Ventana ventanaRef={ventana} idTitulo={idTitulo} onClose={alCerrar}>
          {enviar.isSuccess ? (
            <div role="status" className="flex flex-col items-start gap-4 pr-10">
              <h2 id={idTitulo} className="font-display text-titulo-1 font-black">
                ¡Recibimos tu consulta!
              </h2>
              <p className="text-cuerpo-lg">
                Te mandamos un mail a <strong>{email}</strong>. Te vamos a responder a la brevedad.
              </p>
              <Button onClick={cerrar}>Listo</Button>
            </div>
          ) : (
            <form onSubmit={mandar} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1 pr-10">
                <h2 id={idTitulo} className="font-display text-titulo-1 font-black">
                  Escribinos
                </h2>
                <p className="text-tinta-suave">Te respondemos al mail que nos dejes.</p>
              </div>
              <TextField
                label="Tu mail"
                type="email"
                autoComplete="email"
                placeholder="vos@mail.com"
                value={email}
                error={errores.email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
              <TextField
                label="Asunto"
                placeholder="¿Puedo usar Pinz para un viaje de egresados?"
                maxLength={120}
                value={asunto}
                error={errores.asunto}
                onChange={(evento) => setAsunto(evento.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor={idDescripcion} className="text-etiqueta">
                  Tu consulta
                </label>
                <textarea
                  id={idDescripcion}
                  rows={5}
                  maxLength={2000}
                  value={descripcion}
                  aria-invalid={Boolean(errores.descripcion)}
                  aria-describedby={errores.descripcion ? `${idDescripcion}-ayuda` : undefined}
                  onChange={(evento) => setDescripcion(evento.target.value)}
                  className={`resize-y rounded-sm bg-papel-elevado px-4 py-3 font-semibold text-tinta shadow-chica placeholder:font-medium placeholder:text-tinta-suave focus-visible:shadow-dura ${
                    errores.descripcion ? 'border-3 border-negativo' : 'trazo'
                  }`}
                />
                {errores.descripcion && (
                  <span id={`${idDescripcion}-ayuda`} className="text-meta text-negativo">
                    {errores.descripcion}
                  </span>
                )}
              </div>
              {enviar.isError && (
                <p role="alert" className="font-semibold text-negativo">
                  {errorEnvio}
                </p>
              )}
              <Button type="submit" full disabled={enviar.isPending} className="md:w-auto md:self-start">
                {enviar.isPending ? 'Enviando…' : 'Enviar consulta'}
              </Button>
            </form>
          )}
      </Ventana>
    </>
  )
}
