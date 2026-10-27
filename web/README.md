# Pinz · frontend

La web de Pinz: la landing pública y la app para organizar viajes en grupo (Previaje, Viaje y Post-viaje). Este README es el mapa del frontend: sirve para saber **dónde se cambia cada cosa** sin leer el código.

El frontend todavía no tiene lógica de negocio. Cada pantalla pide sus datos a una capa de **servicios** que hoy devuelve datos de ejemplo, y las partes que dependen del backend o de una librería que no está (mapa, saldos, login, archivos, comprobante y QR) son **slots**: contenedores con su contrato listo para conectar.

## 1. Cómo se levanta

Todo corre en el contenedor `web` del `docker-compose.yml` de la raíz, nunca con el Node de la máquina.

```sh
cp .env.example .env        # solo la primera vez (desde la raíz del repo)
docker compose up -d        # levanta db, api y web
```

- La web queda en **http://localhost:5173**. El contenedor hace `npm install` con el lockfile al arrancar.
- La URL de la API llega como `VITE_API_URL` (en el compose vale `http://localhost:4000`) y se lee con `import.meta.env.VITE_API_URL`.
- Build: `docker compose exec web npm run build`
- Lint: `docker compose exec web npm run lint` (configuración en `eslint.config.js`)

## 2. Stack

Solo se usa lo que está en `package.json`, en la versión del lockfile. No se suman dependencias ni se carga nada desde un CDN.

| Pieza | Paquete | Versión |
| --- | --- | --- |
| UI | `react`, `react-dom` | 19.3.1 |
| Bundler | `vite` + `@vitejs/plugin-react` | 8.3.5 / 6.1.2 |
| Lenguaje | `typescript` (con `erasableSyntaxOnly`: sin `enum` ni `namespace`) | 6.0.3 |
| Estilos | `tailwindcss` + `@tailwindcss/vite` | 4.3.3 |
| Rutas | `react-router-dom`, en modo librería | 7.18.4 |
| Datos | `@tanstack/react-query` | 5.104.5 |
| Contratos | `zod` | 4.6.7 |
| Íconos | `lucide-react`, siempre con `strokeWidth={2}` | 1.61.0 |
| Lint | `eslint` 10 con `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` y `globals` | 10.13.0 |

No hay librería de animación, mapas, QR ni gráficos: el movimiento es CSS y lo demás son slots.

## 3. Estructura

```
web/
  index.html            lang="es", título, descripción y theme-color
  eslint.config.js
  public/
    favicon.svg         el ícono de la pestaña: un pinz genérico coral
    fonts/              Archivo y Figtree en woff2, con sus licencias OFL
  src/
    main.tsx            QueryClientProvider + RouterProvider
    router.tsx          todas las rutas; cada pantalla se carga aparte (lazy)
    styles/
      index.css         Tailwind, @theme con los tokens, @font-face, utilidades de trazo y base
      animaciones.css   keyframes y utilidades animate-* (siempre con motion-safe:)
    components/
      ui/               el design system: Button, Chip, StageSwitch, TextField, PollOption, BalanceRow,
                        ItineraryItem, TripCard, AvatarStack, BottomNav, BarraLateral y Tarjeta
      marca/            Logo, Pin, PinzNote, ElegirPinz y los estados Cargando / NoCargo
      slots/            MapaSlot, SaldosSlot, AuthSlot, ArchivosSlot, ComprobanteSlot, QrSlot y EsperaSlot
    pinz/
      elenco.ts         los 10 personajes: nombre, apodo, tono, sección, descripción y frase
      dibujos.ts        el dibujo de cada pinz, como datos (capas detrás, recortado y delante)
      tonos.ts          las clases de color de cada tono (fill-*, bg-*, bg-*-tinte)
    layouts/
      PublicLayout      ingreso, bienvenida e invitaciones
      AppLayout         fuera de un viaje: Mis viajes y Vos
      ViajeLayout       dentro de un viaje: encabezado de etapa, BottomNav / barra lateral, botón de gasto
      BarraSuperior     mobile: la marca (a Mis viajes) y "Tu perfil", en la app y dentro de un viaje
      CuentaUsuario     al pie de la barra lateral: tu perfil y Cerrar sesión
      EncabezadoViaje   nombre, fechas, avatares (abren Grupo), Emergencias en Viaje y, solo en dev, el StageSwitch
      contextoViaje.ts  useViajeActual(): el viaje y la etapa que se está mirando
    pages/              una carpeta por pantalla (ver la tabla de abajo)
    types/              esquemas zod por entidad: el contrato con el backend
    services/           una función async por operación; hoy devuelven los mocks
    hooks/              React Query sobre cada servicio; las pantallas solo usan hooks
    mocks/datos.ts      todos los datos de ejemplo ("Bariloche con los chicos")
    lib/                etapa (por fechas), fechas, moneda ($ 48.200), saldos y textos
```

## 4. Pantallas

| Ruta | Archivo | Qué usa |
| --- | --- | --- |
| `/` | `pages/landing/Landing.tsx` (una sección por banda en la misma carpeta) | `Pin`, `Logo`, `Button`, `PollOption`, `BalanceRow`, `ItineraryItem` |
| `/ingresar` | `pages/ingresar/Ingresar.tsx` (bypass temporal: en desarrollo, cualquier proveedor lleva a `/viajes`) | `AuthSlot`, `useIngresar` |
| `/bienvenida` | `pages/bienvenida/Bienvenida.tsx` | `TextField`, `Chip`, `ElegirPinz`, `useGuardarPerfil` |
| `/unirse` | `pages/unirse/Unirse.tsx` | `TextField`, `Button` |
| `/unirse/:codigo` | `pages/unirse/VistaInvitacion.tsx` | `Tarjeta`, `AvatarStack`, `useInvitacion`, `useUnirse` |
| `/viajes` | `pages/viajes/MisViajes.tsx` | `TripCard`, `PinzNote` (vacío), `useViajes`, `usePerfil` |
| `/viajes/nuevo` | `pages/viajes/NuevoViaje.tsx` | `TextField`, `TripCard` (vista previa en desktop), `useCrearViaje` |
| `/vos` | `pages/vos/Vos.tsx` | `Pin`, `Tarjeta`, `ArchivosSlot`, `usePerfil`, `useDocumentosPersonales` |
| `/viajes/:id` | `pages/viaje/resumen/Resumen.tsx` → `ResumenPrevaje`, `Hoy` o `ResumenPostViaje` según la etapa | `TarjetaVotacion`, `PinzNote` (tip), `MapaSlot`, `ItineraryItem`, `SaldosSlot` |
| `/viajes/:id/plan` | `pages/viaje/Plan.tsx` | `TarjetaVotacion`, `ItineraryItem`, `MapaSlot`, `useVotaciones`, `useItinerario` |
| `/viajes/:id/cuentas` | `pages/viaje/Cuentas.tsx` | `SaldosSlot`, `ComprobanteSlot`, `Chip`, `useGastos`, `useSaldos`, `useAgregarGasto` |
| `/viajes/:id/baul` | `pages/viaje/Baul.tsx` | `ArchivosSlot`, `Chip`, `useTareas`, `useRequisitos`, `useDocumentos` |
| `/viajes/:id/grupo` | `pages/viaje/Grupo.tsx` | `AvatarStack`, `QrSlot`, `useInvitacionGrupo`, `useMovimientos` |
| `/viajes/:id/emergencias` | `pages/viaje/Emergencias.tsx` (sin pinz, nunca) | `useEmergencias` |
| `*` | `pages/NoEncontrada.tsx` | `PinzNote` (error, genérico) |

Cada pantalla resuelve sus estados de carga, vacío y error con `Cargando`, `NoCargo` y `PinzNote`, usando el pinz de su sección (Chispa en Decidir, Brújula en Plan, Vuelto en Cuentas, Valija en el Baúl, Siesta en Hoy, Postal en Post-viaje). Los errores van con el genérico.

**Agregar gasto:** `pages/viaje/IrAAgregarGasto.tsx` está en la tarjeta de saldos de las tres etapas y lleva a `cuentas#nuevo-gasto`; el formulario baja solo y enfoca el primer campo.

**La etapa** se calcula en `lib/etapa.ts` (`etapaDelViaje`): antes de la ida es Previaje, entre la ida y la vuelta es Viaje y después es Post-viaje. La etapa cambia sola con las fechas. El `StageSwitch` del encabezado, que deja mirar otra etapa, aparece solo en desarrollo (`import.meta.env.DEV`).

## 5. Design system

| Componente | Archivo | Props principales | Para qué |
| --- | --- | --- | --- |
| `Button` / `ButtonLink` | `components/ui/Button.tsx` | `variant` (`primario` · `secundario` · `fantasma` · `emergencia`), `size` (`md` 50px · `sm` 44px), `icon`, `iconRight`, `full`; `ButtonLink` suma `to` | Toda acción. Un solo primario por pantalla. Las clases están en `estilosBoton.ts` por si un `<a>` o un `<label>` tiene que verse como botón |
| `Chip` | `components/ui/Chip.tsx` | `selected`, `tone` (`neutro` o la etapa), `icon` | Filtros y opciones; seleccionado queda hundido y con check |
| `StageSwitch` | `components/ui/StageSwitch.tsx` | `value`, `defaultValue`, `onChange` | Elegir qué etapa mirar |
| `TextField` | `components/ui/TextField.tsx` | `label`, `hint`, `error` + props de `<input>` | Campos con label siempre visible |
| `PollOption` | `components/ui/PollOption.tsx` | `label`, `detail`, `votes`, `total`, `voted`, `onVote` | Una opción de votación con barra punteada |
| `BalanceRow` | `components/ui/BalanceRow.tsx` | `name`, `amount`, `direction`, `pinz`, `action` | Cómo quedás con alguien: signo, palabra y color |
| `ItineraryItem` | `components/ui/ItineraryItem.tsx` | `time`, `title`, `place`, `done`, `current`, `last` | Un momento del día; es un `<li>`, va dentro de un `<ol>` |
| `TripCard` | `components/ui/TripCard.tsx` | `title`, `place`, `dates`, `stage`, `people`, `image`, `pending`, `to` | La card de un viaje en Mis viajes |
| `AvatarStack` | `components/ui/AvatarStack.tsx` | `people` (nombres o `{ name, pinz }`), `max` | Siluetas de pin con inicial, en el tono del pinz |
| `BottomNav` | `components/ui/BottomNav.tsx` | `items` (`{ id, label, icon, to, end }`) | Navegación flotante de mobile (hasta 4) |
| `BarraLateral` | `components/ui/BarraLateral.tsx` | `items`, `pie`, `cuenta` | La navegación desde 1024px |
| `Tarjeta` / `Etiqueta` | `components/ui/Tarjeta.tsx` | `titulo`, `extra`, `fondo` | El bloque de contenido de la app y su badge |
| `Logo` | `components/marca/Logo.tsx` | `variant` (`marca` · `simbolo` · `icono`), `size`, `ink`, `color` | La marca, en curvas: en `marca`, el pin a la izquierda y "pinz" a la derecha |
| `Pin` | `components/marca/Pin.tsx` | `pinz` (elenco o `generico`), `color`, `size`, `label` | El pinz ilustrado |
| `PinzNote` | `components/marca/PinzNote.tsx` | `tipo` (`tip` · `vacio` · `error` · `festejo`), `pinz`, `title`, `action` + `onAction` o `actionTo`, `onClose` | El único lugar con pinz dentro de la app |
| `ElegirPinz` | `components/marca/ElegirPinz.tsx` | `valor`, `onElegir` | La grilla para elegir personalidad |
| `Cargando` / `NoCargo` | `components/marca/Estados.tsx` | `pinz` / `error`, `onReintentar` | Estados de carga y error de las pantallas |

## 6. Tokens

Los tokens viven en `src/styles/index.css`, dentro de `@theme`, y salen de `tokens.css` del design system. Tailwind los convierte en utilidades y en variables CSS (`var(--color-coral)`).

| Grupo | Ejemplos de uso |
| --- | --- |
| Colores (con tintes y tonos del elenco) | `bg-coral`, `text-tinta`, `bg-sol-tinte`, `fill-durazno`, `text-positivo` |
| Radios | `rounded-sm` (12), `rounded-md` (18), `rounded-lg` (26), `rounded-full` (pill) |
| Sombras duras | `shadow-chica`, `shadow-dura`, `shadow-grande` |
| Tipografías | `font-display` (Archivo), `font-texto` (Figtree, la base) |
| Escala de texto | `text-display-xl`, `text-display`, `text-titulo-1`, `text-titulo-2`, `text-monto`, `text-cuerpo-lg`, `text-cuerpo`, `text-etiqueta`, `text-meta`, `text-sobretitulo` |
| Espaciado (grilla de 4px) | `p-4` = `espacio-4`, `gap-8` = `espacio-8`; medidas: `min-h-toque` (44), `min-h-control` (50), `h-nav` (68), `w-lateral` (240) |
| Contornos | `trazo-fino` (2px), `trazo` (2,5px), `trazo-grueso` (3,5px) y por lado: `trazo-b`, `trazo-t`, `trazo-r`, `trazo-grueso-b`… El color es siempre tinta |
| Breakpoints | `md` (768), `lg` (1024, barra lateral), `xl` (1280); contenido con `max-w-contenido` (1200) |
| Movimiento | `motion-safe:animate-bob`, `animate-jump`, `animate-cinta`, `animate-camina`, `animate-sube`, `animate-asoma`; `ease-rebote` |

**Regla:** nunca se escriben valores a mano (`bg-[#ff8a66]`, `p-[13px]`, hex sueltos). Si falta algo, se suma como token en `@theme` o como `@utility`. Las paletas de Tailwind están vaciadas, así que `bg-red-500` ni siquiera existe. La única excepción son los colores de accesorios de los pinz que no son de la paleta, que viven solo en `pinz/dibujos.ts`.

Las clases que dependen de un dato (el tono de un pinz, el color de una etapa) se toman de los mapas de `pinz/tonos.ts`, escritas enteras para que Tailwind las encuentre.

## 7. Los pinz

- **El elenco** son 10 personalidades, en `pinz/elenco.ts`: Chispa, Brújula, Vuelto, Siesta, Valija, Postal, Nono, Trasnoche, Morfi y Cumbre. Cada una tiene un tono y una sección que acompaña. Sus dibujos están en `pinz/dibujos.ts`, en capas: lo que va detrás del cuerpo, lo recortado dentro de la silueta y la cara con sus accesorios.
- **El genérico** es el pin de la cara feliz y solo cambia de color: `<Pin color="mar" />`. Es el de los errores y el 404.
- **Uso:** `<Pin pinz="vuelto" size={64} />`. Con `label=""` es decorativo.
- **Reglas en la app:**
  - Como mucho un pinz por pantalla, y solo a través de `PinzNote` (64px en fila, 112px en bloque).
  - Nunca en listas, formularios ni montos, y nunca en Emergencias.
  - En avatares va siempre la silueta con la inicial (`AvatarStack`).
  - Los grandes son solo de la landing y de la grilla para elegir personalidad.

## 8. Cómo conectar el backend

### Servicios

Cada archivo de `src/services/` es un dominio. Las lecturas validan la respuesta con su esquema zod; las escrituras hoy pasan por `sinBackend()`, que espera, muestra en consola lo que se mandaría (`[sin backend] …`) y no cambia ningún dato.

| Servicio | Firma | Responde |
| --- | --- | --- |
| `viajes` | `listar()` | `Viaje[]` |
| | `obtener(id)` | `Viaje` |
| | `resumen(id)` | `ResumenViaje` |
| | `crear(datos: NuevoViaje)` | — |
| | `verInvitacion(codigo)` | `Invitacion` |
| | `unirse(codigo)` | — |
| | `emergencias(id)` | `Emergencias` |
| `perfil` | `obtener()` | `Perfil` |
| | `guardar(datos: DatosPerfil)` | — |
| `votaciones` | `listar(viajeId)` | `Votacion[]` |
| | `votar(viajeId, votacionId, opcionId)` | — |
| | `proponer(viajeId, datos: NuevaOpcion)` | — |
| `itinerario` | `listar(viajeId)` | `ItemItinerario[]` |
| | `hoy(viajeId)` | `Hoy` |
| | `agregar(viajeId, datos: NuevoItemItinerario)` | — |
| | `exportarCalendario(viajeId)` | archivo .ics |
| `gastos` | `listar(viajeId)` | `Gasto[]` |
| | `saldos(viajeId)` | `Saldos` |
| | `agregar(viajeId, datos: NuevoGasto)` | — |
| | `registrarPago(viajeId, personaId)` | — |
| | `simplificar(viajeId)` | — |
| | `leerComprobante(viajeId, archivo)` | — |
| `baul` | `tareas(viajeId)` | `Tarea[]` |
| | `requisitos(viajeId)` | `Requisito[]` |
| | `documentos(viajeId)` / `documentosPersonales()` | `Documento[]` |
| | `marcarTarea(viajeId, tareaId, hecha)` | — |
| | `agregarTarea(viajeId, datos: NuevaTarea)` | — |
| | `subirDocumento(viajeId, archivo)` / `subirDocumentoPersonal(archivo)` | — |
| | `abrirDocumento(id)` | link del documento |
| `grupo` | `invitacion(viajeId)` | `InvitacionGrupo` |
| | `movimientos(viajeId)` | `Movimiento[]` |
| | `invitarPorMail(viajeId, mail)` | — |
| | `cambiarRol(viajeId, personaId, rol)` | — |
| | `salir(viajeId)` | — |
| | `repetir(viajeId, modo)` | — |
| `auth` | `ingresar(proveedor)`, `cerrarSesion()` | `useCerrarSesion` limpia la caché y vuelve a `/` |

Los esquemas están en `src/types/` con el mismo nombre que el tipo (`ViajeSchema`, `SaldosSchema`…). La `api` también usa zod 4, así que se pueden compartir.

**Para conectar un servicio**, se cambia solo el cuerpo de la función. La firma, el hook y la pantalla quedan igual. Por ejemplo, en `services/viajes.ts`:

```ts
// Hoy
export async function listar() {
  await demora()
  return z.array(ViajeSchema).parse(viajes)
}

// Con backend
const API = import.meta.env.VITE_API_URL

export async function listar() {
  const respuesta = await fetch(`${API}/viajes`, { credentials: 'include' })
  if (!respuesta.ok) throw new Error('No pudimos cargar tus viajes.')
  return z.array(ViajeSchema).parse(await respuesta.json())
}
```

Una escritura igual: `crear(datos)` pasa de `sinBackend('viajes.crear', datos)` a un `fetch` con `method: 'POST'` y `body: JSON.stringify(datos)`. El mensaje de los `Error` es lo que la pantalla le muestra a la persona, así que va con voseo. Cuando no quede ningún servicio usando `mocks/datos.ts`, la carpeta `mocks/` se borra.

### Slots

| Slot | Archivo | Recibe | Emite | Dónde se monta |
| --- | --- | --- | --- | --- |
| Mapa | `components/slots/MapaSlot.tsx` | `puntos: { id, nombre, lat, lng, tipo }[]`, `personas: { id, nombre, pinz, lat, lng }[]`, `contenedorRef`, `alto` | `onSeleccionarPunto(id)` | `pages/viaje/resumen/Hoy.tsx`, `pages/viaje/Plan.tsx` |
| Saldos | `components/slots/SaldosSlot.tsx` | `saldos: { persona, monto }[]` ya calculados (o `null`), `moneda` | `onRegistrarPago(personaId)` | `pages/viaje/Cuentas.tsx`, `pages/viaje/resumen/ResumenPostViaje.tsx` |
| Auth | `components/slots/AuthSlot.tsx` | `estado` (`listo` · `cargando` · `error`) | `onElegirProveedor('google' \| 'apple' \| 'mail')` | `pages/ingresar/Ingresar.tsx` |
| Archivos | `components/slots/ArchivosSlot.tsx` | `archivos: { id, nombre, tipo, tamano }[]`, `ayuda` | `onSubir(archivo)`, `onAbrir(id)` | `pages/viaje/Baul.tsx`, `pages/vos/Vos.tsx` |
| Comprobante | `components/slots/ComprobanteSlot.tsx` | — | `onEscanear(archivo)` | `pages/viaje/Cuentas.tsx` |
| QR | `components/slots/QrSlot.tsx` | `valor` (link de invitación) | — | `pages/viaje/Grupo.tsx` |

Mientras no estén conectados, muestran `EsperaSlot`: un recuadro punteado que dice qué va ahí. Nunca simulan el contenido real. La librería de mapas se monta en el elemento de `contenedorRef`, que tiene tamaño fijo. El cálculo de saldos lo hace siempre el backend; el front solo los ordena (primero lo que tenés que poner, después lo que te deben, al final con quién estás a mano).

## 9. Convenciones

- **Nombres:** los del dominio van en español (`viaje`, `gasto`, `saldo`, `votacion`). Los componentes del design system conservan su nombre y sus props (`Button`, `variant`).
- **Tipos:** sin `any`. Los datos de dominio se tipan con `z.infer` de sus esquemas.
- **Pantallas:** solo usan hooks, nunca servicios ni mocks directo. Los botones que disparan algo del backend llaman a un hook de mutación.
- **Comentarios:** solo cuando explican un porqué que el código no dice.
- **Accesibilidad:**
  - HTML semántico y foco visible: `outline` de 3px en tinta, ya en la base.
  - Áreas táctiles de 44px.
  - Estados nunca solo con color: los saldos van con signo y palabra, los votos con check.
  - Todo movimiento va con `motion-safe:`.
- **Textos:** con voseo rioplatense, cortos y sin emoji ("Agregar gasto", "Te falta poner con Fede").
  - Los botones dicen qué pasa; nada de "OK" ni "Enviar".
  - La plata, sin culpa: "te falta poner" y "te tiene que devolver", nunca "debe".
  - Mayúscula solo al inicio.

## 10. Pendientes

- **"¿Es gratis?"** en la landing (`pages/landing/Preguntas.tsx`): falta definir el modelo de precios. Está marcado como pendiente en la interfaz y con un comentario en el código.
- **Mapa, QR, lectura de comprobantes, login y archivos:** son slots. Esperan la librería o el backend.
- **Roles:** `cambiarRol` y `useCambiarRol` están listos, pero falta la interfaz para el organizador (HU-08).
- **Funciones sin flujo propio todavía:**
  - Recuperar acceso (HU-03).
  - División por consumo con propina (HU-15).
  - Pagar con alias o CBU (HU-18).
  - "Cómo llegar" con la app de mapas (HU-23).
  - Ubicación en vivo (HU-24).
- **Sin backend, nada cambia:** las mutaciones no cambian los datos de ejemplo. Al votar o cargar un gasto la pantalla no se actualiza hasta que haya backend.

## Modo oscuro (en prueba)

- Se elige en **Vos → Apariencia** (claro, oscuro o como el dispositivo). Se guarda en `localStorage` (`pinz-tema`); no pasa por el backend. Lógica en `src/lib/tema.ts`, hooks en `src/hooks/tema.ts`, y un script en `index.html` lo aplica antes de pintar.
- Los tokens que cambian con el tema están en `@theme inline` y leen variables crudas (`--papel`, `--tinta`, `--contorno`…) definidas en `:root` y en `[data-tema="oscuro"]`. Los pastel no cambian.
- `tinta` es el texto y `contorno` el trazo y la sombra: para bordes y sombras se usa `contorno`, nunca `tinta`.
- `tema-claro` marca una isla que vuelve a la paleta clara: los dibujos (`Pin`, `AvatarStack`, logo) y todo lo que tiene relleno pastel, para que su texto siga oscuro.
- La variante `oscuro:` es para lo que un token no resuelve, como `FONDO_DESTACADO` en `pinz/tonos.ts` para bloques grandes.
- La landing siempre se ve en claro (`useSoloClaro`).
