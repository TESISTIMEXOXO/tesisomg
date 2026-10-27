import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthSlot } from '../../components/slots/AuthSlot'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import {
  useEntrarConGoogle,
  useIngresarConContrasena,
  usePedirRecuperar,
  useRecuperar,
  useRegistrar,
  useSesion,
  useVerificarRegistro,
} from '../../hooks/auth'
import { GOOGLE_CLIENT_ID, GoogleCancelado, cargarGoogle } from '../../lib/google'
import { codigoDeError, rechazoCodigo } from '../../services/auth'
import { CodigoMailSchema, EmailSchema, IngresoSchema, RecuperarSchema, RegistroSchema, type Proveedor } from '../../types/auth'

type Paso = 'inicio' | 'registro' | 'ingreso' | 'recuperar'

const TITULOS: Record<Paso, string> = {
  inicio: 'Entrá a Pinz',
  registro: 'Creá tu cuenta',
  ingreso: 'Iniciá sesión',
  recuperar: 'Cambiá tu contraseña',
}

const estiloLink = 'rounded-sm font-extrabold underline decoration-2 underline-offset-4'

export function Ingresar() {
  const { data: sesion } = useSesion()
  const [paso, setPaso] = useState<Paso>('inicio')
  // Compartido entre pasos: si la contraseña no coincide y va a cambiarla, el mail ya está escrito.
  const [email, setEmail] = useState('')

  // Cubre el final de todos los caminos: al abrir sesión queda en caché y se sigue a la app.
  if (sesion) return <Navigate to={sesion.perfilCompleto ? '/viajes' : '/bienvenida'} replace />

  const props = { onIrA: setPaso, email, onEmail: setEmail }

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-black">{TITULOS[paso]}</h1>
        {paso === 'inicio' && (
          <p className="text-cuerpo-lg text-tinta-suave">Entrá con tu cuenta de Google o creá una con tu mail.</p>
        )}
      </div>
      {paso === 'inicio' && <Inicio onIrA={setPaso} />}
      {paso === 'registro' && <Registro {...props} />}
      {paso === 'ingreso' && <Ingreso {...props} />}
      {paso === 'recuperar' && <Recuperar {...props} />}
    </div>
  )
}

type PasoProps = { onIrA: (paso: Paso) => void }
type PasoConEmailProps = PasoProps & { email: string; onEmail: (email: string) => void }

/** Un link del texto que lleva a otro paso ("Iniciá sesión", "¿Querés cambiarla?"). */
function LinkPaso({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={estiloLink} onClick={onClick}>
      {children}
    </button>
  )
}

function MensajeError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="font-semibold text-negativo">
      {children}
    </p>
  )
}

/** Separa los errores de validación por campo. */
function erroresPorCampo(issues: { path: PropertyKey[]; message: string }[]) {
  const errores: Record<string, string> = {}
  for (const issue of issues) {
    const campo = String(issue.path[0])
    errores[campo] ??= issue.message
  }
  return errores
}

/** Qué decir cuando el backend rechaza un código del mail. hayQuePedirOtro: vencido o sin intentos. */
function mensajeCodigo(error: unknown) {
  const rechazo = rechazoCodigo(error)
  if (rechazo?.error === 'codigo-incorrecto') {
    const quedan = rechazo.intentosRestantes
    return { hayQuePedirOtro: false, mensaje: `Ese código no es. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.` }
  }
  if (rechazo) return { hayQuePedirOtro: true, mensaje: 'Este código ya no sirve. Pedí uno nuevo.' }
  return null
}

function Inicio({ onIrA }: PasoProps) {
  const google = useEntrarConGoogle()
  const [noDisponible, setNoDisponible] = useState(false)

  // Bajar el script de Google antes del click, así la ventanita se abre al toque y el navegador no la bloquea.
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) cargarGoogle().catch(() => {})
  }, [])

  function elegir(proveedor: Proveedor) {
    if (proveedor === 'mail') {
      onIrA('registro')
      return
    }
    if (!GOOGLE_CLIENT_ID) {
      setNoDisponible(true)
      return
    }
    google.mutate()
  }

  // Cerrar la ventanita sin elegir cuenta no es un error.
  const fallo = google.isError && !(google.error instanceof GoogleCancelado)
  const mensajeError =
    noDisponible || codigoDeError(google.error) === 'proveedor-no-disponible'
      ? 'El ingreso con Google todavía no está configurado. Creá una cuenta con tu mail.'
      : undefined

  return (
    <>
      <AuthSlot
        estado={google.isPending ? 'cargando' : fallo || noDisponible ? 'error' : 'listo'}
        mensajeError={mensajeError}
        onElegirProveedor={elegir}
      />
      <p className="text-center">
        ¿Ya tenés cuenta? <LinkPaso onClick={() => onIrA('ingreso')}>Iniciá sesión</LinkPaso>
      </p>
    </>
  )
}

/** Crear cuenta, paso 1: mail y contraseña. Después llega un código al mail para confirmarla. */
function Registro({ onIrA, email, onEmail }: PasoConEmailProps) {
  const registrar = useRegistrar()
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const datos = RegistroSchema.safeParse({ email, contrasena })
    if (!datos.success) {
      setErrores(erroresPorCampo(datos.error.issues))
      return
    }
    setErrores({})
    registrar.mutate(datos.data)
  }

  if (registrar.isSuccess) {
    return <CodigoRegistro email={registrar.variables.email} contrasena={registrar.variables.contrasena} onCambiarMail={() => registrar.reset()} />
  }

  const yaRegistrado = codigoDeError(registrar.error) === 'ya-registrado'

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoEmail value={email} error={errores.email} onChange={onEmail} />
      <TextField
        label="Contraseña"
        hint="Al menos 6 caracteres y una mayúscula."
        type="password"
        autoComplete="new-password"
        value={contrasena}
        error={errores.contrasena}
        onChange={(evento) => setContrasena(evento.target.value)}
      />
      {yaRegistrado && (
        <MensajeError>
          Ese mail ya tiene una cuenta. <LinkPaso onClick={() => onIrA('ingreso')}>Iniciá sesión</LinkPaso>
        </MensajeError>
      )}
      {registrar.isError && !yaRegistrado && <MensajeError>No pudimos mandar el código. Revisá la conexión y probá de nuevo.</MensajeError>}
      <Button type="submit" full disabled={registrar.isPending}>
        {registrar.isPending ? 'Mandando el código…' : 'Continuar'}
      </Button>
      <Button variant="fantasma" icon={ArrowLeft} full onClick={() => onIrA('inicio')}>
        Volver
      </Button>
    </form>
  )
}

type CodigoRegistroProps = { email: string; contrasena: string; onCambiarMail: () => void }

/** Crear cuenta, paso 2: el código de 6 dígitos que llegó al mail. */
function CodigoRegistro({ email, contrasena, onCambiarMail }: CodigoRegistroProps) {
  const verificar = useVerificarRegistro()
  // Una mutación aparte: si reenviar usara la del paso anterior, mientras manda se volvería al formulario.
  const reenviar = useRegistrar()
  const [codigo, setCodigo] = useState('')
  const [errorCodigo, setErrorCodigo] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const valido = CodigoMailSchema.safeParse(codigo)
    if (!valido.success) {
      setErrorCodigo(valido.error.issues[0]?.message)
      return
    }
    setErrorCodigo(undefined)
    verificar.mutate({ email, codigo: valido.data })
  }

  function pedirOtro() {
    reenviar.mutate(
      { email, contrasena },
      {
        onSuccess: () => {
          verificar.reset()
          setCodigo('')
        },
      },
    )
  }

  const rechazo = verificar.isError ? mensajeCodigo(verificar.error) : null

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <AvisoCodigo email={email} />
      <CampoCodigo value={codigo} error={errorCodigo} onChange={setCodigo} />
      {verificar.isError && <MensajeError>{rechazo?.mensaje ?? 'No pudimos comprobar el código. Revisá la conexión y probá de nuevo.'}</MensajeError>}
      <EstadoReenvio mandado={reenviar.isSuccess && !verificar.isError} fallo={reenviar.isError} />
      <Button type="submit" full disabled={verificar.isPending || rechazo?.hayQuePedirOtro}>
        {verificar.isPending ? 'Creando tu cuenta…' : 'Crear cuenta'}
      </Button>
      <BotonReenviar destacado={rechazo?.hayQuePedirOtro} mandando={reenviar.isPending} onClick={pedirOtro} />
      <Button variant="fantasma" icon={ArrowLeft} full onClick={onCambiarMail}>
        Usar otro mail
      </Button>
    </form>
  )
}

/** Entrar a una cuenta que ya existe. Sin tope de intentos: cada error dice qué pasó y cómo seguir. */
function Ingreso({ onIrA, email, onEmail }: PasoConEmailProps) {
  const ingresar = useIngresarConContrasena()
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const datos = IngresoSchema.safeParse({ email, contrasena })
    if (!datos.success) {
      setErrores(erroresPorCampo(datos.error.issues))
      return
    }
    setErrores({})
    ingresar.mutate(datos.data)
  }

  const motivo = codigoDeError(ingresar.error)
  let error: ReactNode = null
  if (motivo === 'contrasena-incorrecta') {
    error = (
      <>
        La contraseña es incorrecta. <LinkPaso onClick={() => onIrA('recuperar')}>¿Querés cambiarla?</LinkPaso>
      </>
    )
  } else if (motivo === 'sin-cuenta') {
    error = (
      <>
        No hay una cuenta con ese mail. <LinkPaso onClick={() => onIrA('registro')}>¿Querés crear una?</LinkPaso>
      </>
    )
  } else if (motivo === 'sin-contrasena') {
    error = (
      <>
        Esa cuenta entra con Google y todavía no tiene contraseña. Volvé y usá “Seguir con Google”, o{' '}
        <LinkPaso onClick={() => onIrA('recuperar')}>creá una contraseña</LinkPaso>.
      </>
    )
  } else if (ingresar.isError) {
    error = 'No pudimos iniciar sesión. Revisá la conexión y probá de nuevo.'
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoEmail value={email} error={errores.email} onChange={onEmail} />
      <div className="flex flex-col gap-2">
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={contrasena}
          error={errores.contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
        />
        <p className="text-meta">
          <LinkPaso onClick={() => onIrA('recuperar')}>¿Olvidaste tu contraseña?</LinkPaso>
        </p>
      </div>
      {error && <MensajeError>{error}</MensajeError>}
      <Button type="submit" full disabled={ingresar.isPending}>
        {ingresar.isPending ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
      <Button variant="fantasma" icon={ArrowLeft} full onClick={() => onIrA('inicio')}>
        Volver
      </Button>
      <p className="text-center">
        ¿No tenés cuenta? <LinkPaso onClick={() => onIrA('registro')}>Creá una</LinkPaso>
      </p>
    </form>
  )
}

/** Olvidé mi contraseña, paso 1: el mail de la cuenta, para mandarle un código. */
function Recuperar({ onIrA, email, onEmail }: PasoConEmailProps) {
  const pedirCodigo = usePedirRecuperar()
  const [errorEmail, setErrorEmail] = useState<string>()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const valido = EmailSchema.safeParse(email)
    if (!valido.success) {
      setErrorEmail(valido.error.issues[0]?.message)
      return
    }
    setErrorEmail(undefined)
    pedirCodigo.mutate(valido.data)
  }

  if (pedirCodigo.isSuccess) {
    return <CodigoRecuperar email={pedirCodigo.variables} onCambiarMail={() => pedirCodigo.reset()} onIrA={onIrA} />
  }

  const sinCuenta = codigoDeError(pedirCodigo.error) === 'sin-cuenta'

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <p>Te mandamos un código a tu mail para que elijas una contraseña nueva.</p>
      <CampoEmail value={email} error={errorEmail} onChange={onEmail} />
      {sinCuenta && (
        <MensajeError>
          No hay una cuenta con ese mail. <LinkPaso onClick={() => onIrA('registro')}>¿Querés crear una?</LinkPaso>
        </MensajeError>
      )}
      {pedirCodigo.isError && !sinCuenta && <MensajeError>No pudimos mandar el código. Revisá la conexión y probá de nuevo.</MensajeError>}
      <Button type="submit" full disabled={pedirCodigo.isPending}>
        {pedirCodigo.isPending ? 'Mandando el código…' : 'Mandame el código'}
      </Button>
      <Button variant="fantasma" icon={ArrowLeft} full onClick={() => onIrA('ingreso')}>
        Volver
      </Button>
    </form>
  )
}

type CodigoRecuperarProps = PasoProps & { email: string; onCambiarMail: () => void }

/** Olvidé mi contraseña, paso 2: el código del mail y la contraseña nueva, juntos. */
function CodigoRecuperar({ email, onCambiarMail }: CodigoRecuperarProps) {
  const cambiar = useRecuperar()
  const reenviar = usePedirRecuperar()
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const datos = RecuperarSchema.safeParse({ codigo, contrasena })
    if (!datos.success) {
      setErrores(erroresPorCampo(datos.error.issues))
      return
    }
    setErrores({})
    cambiar.mutate({ email, ...datos.data })
  }

  function pedirOtro() {
    reenviar.mutate(email, {
      onSuccess: () => {
        cambiar.reset()
        setCodigo('')
      },
    })
  }

  const rechazo = cambiar.isError ? mensajeCodigo(cambiar.error) : null

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <AvisoCodigo email={email} />
      <CampoCodigo value={codigo} error={errores.codigo} onChange={setCodigo} />
      <TextField
        label="Contraseña nueva"
        hint="Al menos 6 caracteres y una mayúscula."
        type="password"
        autoComplete="new-password"
        value={contrasena}
        error={errores.contrasena}
        onChange={(evento) => setContrasena(evento.target.value)}
      />
      {cambiar.isError && <MensajeError>{rechazo?.mensaje ?? 'No pudimos cambiar la contraseña. Revisá la conexión y probá de nuevo.'}</MensajeError>}
      <EstadoReenvio mandado={reenviar.isSuccess && !cambiar.isError} fallo={reenviar.isError} />
      <Button type="submit" full disabled={cambiar.isPending || rechazo?.hayQuePedirOtro}>
        {cambiar.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
      </Button>
      <BotonReenviar destacado={rechazo?.hayQuePedirOtro} mandando={reenviar.isPending} onClick={pedirOtro} />
      <Button variant="fantasma" icon={ArrowLeft} full onClick={onCambiarMail}>
        Usar otro mail
      </Button>
    </form>
  )
}

/* ---------- Piezas compartidas ---------- */

function CampoEmail({ value, error, onChange }: { value: string; error?: string; onChange: (email: string) => void }) {
  return (
    <TextField
      label="Tu mail"
      type="email"
      inputMode="email"
      autoComplete="email"
      autoFocus
      value={value}
      error={error}
      onChange={(evento) => onChange(evento.target.value)}
    />
  )
}

function CampoCodigo({ value, error, onChange }: { value: string; error?: string; onChange: (codigo: string) => void }) {
  return (
    <TextField
      label="Código"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      autoFocus
      className="[&_input]:text-titulo-2 [&_input]:tracking-[0.4em]"
      value={value}
      error={error}
      onChange={(evento) => onChange(evento.target.value.replace(/\D/g, ''))}
    />
  )
}

function AvisoCodigo({ email }: { email: string }) {
  return (
    <p>
      Te mandamos un código de 6 números a <strong className="font-extrabold">{email}</strong>. Vence en 10 minutos. Si no lo ves, revisá
      la carpeta de spam.
    </p>
  )
}

function EstadoReenvio({ mandado, fallo }: { mandado: boolean; fallo: boolean }) {
  if (fallo) return <MensajeError>No pudimos mandar otro código. Probá de nuevo.</MensajeError>
  if (!mandado) return null
  return (
    <p role="status" className="text-meta text-tinta-suave">
      Te mandamos un código nuevo. El anterior ya no sirve.
    </p>
  )
}

/** destacado: el código ya no sirve, así que pedir otro pasa a ser la acción principal. */
function BotonReenviar({ destacado, mandando, onClick }: { destacado?: boolean; mandando: boolean; onClick: () => void }) {
  return (
    <Button variant={destacado ? 'secundario' : 'fantasma'} full disabled={mandando} onClick={onClick}>
      {mandando ? 'Mandando…' : 'Mandame otro código'}
    </Button>
  )
}
