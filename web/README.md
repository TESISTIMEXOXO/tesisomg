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
                        ItineraryItem, TripCard, AvatarStack, BottomNav, Ventana, VistaArchivo y Tarjeta
      marca/            Logo, BarraMarca (la barra con la marca de la landing y las pantallas públicas), Pin,
                        PinzNote, ElegirPinz y los estados Cargando / NoCargo
      landing/          Camino: la ruta celeste que recorre la landing
      slots/            MapaSlot, SaldosSlot, AuthSlot, ArchivosSlot, ComprobanteSlot, QrSlot y EsperaSlot
    pinz/
      elenco.ts         los 10 personajes: nombre, apodo, tono, sección, descripción y frase
      dibujos.ts        el dibujo de cada pinz, como datos (capas detrás, recortado y delante)
      tonos.ts          las clases de color de cada tono (fill-*, bg-*, bg-*-tinte)
    layouts/
      PublicLayout      bienvenida e invitaciones
      AppLayout         fuera de un viaje: Mis viajes y Vos
      ViajeLayout       dentro de un viaje: encabezado de etapa, BottomNav con SOS (Emergencias), botón de gasto
      BarraSuperior     la marca (a Mis viajes) y "Tu perfil", en la app y dentro de un viaje
      EncabezadoViaje   nombre, fechas, avatares (abren Grupo) y, solo en dev, el StageSwitch
      contextoViaje.ts  useViajeActual(): el viaje y la etapa que se está mirando
    pages/              una carpeta por pantalla (ver la tabla de abajo)
    types/              esquemas zod por entidad: el contrato con el backend
    services/           una función async por operación; hoy devuelven los mocks
    hooks/              React Query sobre cada servicio; las pantallas solo usan hooks. `ahora.ts`: la hora, renovada cada minuto
    mocks/datos.ts      todos los datos de ejemplo ("Bariloche con los chicos")
    lib/                etapa (por fechas), fechas, moneda ($ 48.200), saldos, textos, guardarArchivo y el camino de la landing
```

## 4. Pantallas

| Ruta | Archivo | Qué usa |
| --- | --- | --- |
| `/` | `pages/landing/Landing.tsx` (una sección por archivo en la misma carpeta; ver "La landing") | `Camino`, `Pin`, `Logo`, `Button`, `PollOption`, `BalanceRow`, `ItineraryItem`, `AvatarStack` |
| `/ingresar` | `pages/ingresar/Ingresar.tsx`, una `Ventana` sobre la landing: es ruta hija de `Landing` y al cerrarla vuelve a `/` (bypass temporal: en desarrollo, cualquier proveedor lleva a `/viajes`). Con `?paso=ingreso` abre directo en "Iniciá sesión", que también ofrece "Iniciar con Google" | `AuthSlot`, `useIngresar` |
| `/bienvenida` | `pages/bienvenida/Bienvenida.tsx` | `TextField`, `Chip`, `ElegirPinz`, `useGuardarPerfil` |
| `/unirse` | `pages/unirse/Unirse.tsx` | `TextField`, `Button` |
| `/unirse/:codigo` | `pages/unirse/VistaInvitacion.tsx` | `Tarjeta`, `AvatarStack`, `useInvitacion`, `useUnirse` |
| `/viajes` | `pages/viajes/MisViajes.tsx` | `TripCard`, `PinzNote` (vacío), `useViajes`, `usePerfil` |
| `/viajes/nuevo` | `pages/viajes/NuevoViaje.tsx` | `TextField`, `TripCard` (vista previa en desktop), `useCrearViaje` |
| `/vos` | `pages/vos/Vos.tsx` | `Pin`, `Tarjeta`, `ArchivosSlot`, `VistaArchivo`, `usePerfil`, `useDocumentosPersonales` || `/viajes/:id` | `pages/viaje/resumen/Resumen.tsx` → `ResumenPrevaje`, `Hoy` o `ResumenPostViaje` según la etapa | `TarjetaVotacion`, `PinzNote` (tip), `MapaSlot`, `ItineraryItem`, `SaldosSlot` |
| `/viajes/:id/agenda` | `pages/viaje/Agenda.tsx`. Abre en el próximo día con actividades; en semana y mes se pintan los días que tienen actividades y el elegido lleva un anillo. En el día, lo que viene va de lo más próximo a lo más lejano y lo que ya pasó se tilda solo (`useAhora`, cada minuto, con la hora del dispositivo) y baja al final | `ItineraryItem`, `MapaSlot`, `useItinerario`, `useAhora` |
| `/viajes/:id/listas` | `pages/viaje/Listas.tsx` | `TarjetaVotacion`, `useVotaciones`, `useTareas`, `useRequisitos` |
| `/viajes/:id/cuentas` | `pages/viaje/Cuentas.tsx` | `SaldosSlot`, `ComprobanteSlot`, `Chip`, `useGastos`, `useSaldos`, `useAgregarGasto` |
| `/viajes/:id/baul` | `pages/viaje/Baul.tsx` | `ArchivosSlot`, `VistaArchivo`, `Chip`, `useTareas`, `useRequisitos`, `useDocumentos` |
| `/viajes/:id/grupo` | `pages/viaje/Grupo.tsx` | `AvatarStack`, `QrSlot`, `useInvitacionGrupo`, `useMovimientos` |
| `/viajes/:id/emergencias` | `pages/viaje/Emergencias.tsx` (sin pinz, nunca) | `useEmergencias` |
| `*` | `pages/NoEncontrada.tsx` | `PinzNote` (error, genérico) |

Cada pantalla resuelve sus estados de carga, vacío y error con `Cargando`, `NoCargo` y `PinzNote`, usando el pinz de su sección (Brújula en Agenda, Valija en Listas, Vuelto en Cuentas, Postal en el Baúl, Siesta en Hoy, Postal en Post-viaje). Los errores van con el genérico.

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
| `BottomNav` | `components/ui/BottomNav.tsx` | `items` (`{ id, label, icon, to, end }`, hasta 5), `sosTo` | La navegación de la app: barra flotante abajo, en todos los tamaños. Dentro de un viaje suma "SOS" en rojo, siempre al final: es el único acceso a Emergencias |
| `Ventana` | `components/ui/Ventana.tsx` | `ventanaRef`, `idTitulo`, `onClose`, `ancha` | La ventana emergente con el fondo oscurecido (`dialog` nativo): el ingreso y el formulario de contacto. Con `ancha` ocupa toda la pantalla, para `VistaArchivo` |
| `VistaArchivo` | `components/ui/VistaArchivo.tsx` | `nombre` (null = cerrada), `archivo`, `error`, `onReintentar`, `onClose` | Muestra un PDF o una foto en una `Ventana` ancha, con "Descargar" y "Compartir" (menú de compartir del dispositivo, solo si el navegador puede mandar archivos). Si el navegador no muestra PDFs adentro de la página (Chrome en Android), ofrece descargarlo. Se usa con `useVistaDocumento()` |
| `Tarjeta` / `Etiqueta` | `components/ui/Tarjeta.tsx` | `titulo`, `extra`, `fondo` | El bloque de contenido de la app y su badge |
| `Logo` | `components/marca/Logo.tsx` | `variant` (`marca` · `simbolo` · `icono`), `size` (en `marca`, el alto de la palabra), `ink`, `label` | La marca: el pinz genérico coral pegado a "pinz" en Archivo 900. El pin es siempre coral. Las versiones en curvas (`pinz-logo.svg`) son para documentos y Open Graph; en la interfaz se usa el componente |
| `Pin` | `components/marca/Pin.tsx` | `pinz` (elenco o `generico`), `color`, `size`, `label` | El pinz ilustrado |
| `PinzNote` | `components/marca/PinzNote.tsx` | `tipo` (`tip` · `vacio` · `error` · `festejo`), `pinz`, `title`, `action` + `onAction` o `actionTo`, `onClose` | El único lugar con pinz dentro de la app |
| `ElegirPinz` | `components/marca/ElegirPinz.tsx` | `valor`, `onElegir` | La grilla para elegir personalidad |
| `Cargando` / `NoCargo` | `components/marca/Estados.tsx` | `pinz` / `error`, `onReintentar` | Estados de carga y error de las pantallas |

## 6. Tokens

Los tokens viven en `src/styles/index.css`, dentro de `@theme`, y salen de `tokens.css` del design system. Tailwind los convierte en utilidades y en variables CSS (`var(--color-coral)`).

| Grupo | Ejemplos de uso |
| --- | --- |
| Colores (con tintes y tonos del elenco) | `bg-coral`, `text-tinta`, `bg-sol-tinte`, `fill-durazno`, `text-positivo` |
| Radios | `rounded-sm` (12), `rounded-md` (18), `rounded-lg` (26), `rounded-xl` (40, el celular de la landing), `rounded-full` (pill) |
| Sombras duras | `shadow-chica`, `shadow-dura`, `shadow-grande`; `shadow-cinta` (solo hacia abajo, las cintas de la landing) |
| Tipografías | `font-display` (Archivo), `font-texto` (Figtree, la base) |
| Escala de texto | `text-display-xl`, `text-display`, `text-titulo-1`, `text-titulo-2`, `text-monto`, `text-cuerpo-lg`, `text-cuerpo`, `text-etiqueta`, `text-meta`, `text-sobretitulo` |
| Titulares de la landing | `text-portada` / `lg:text-portada-lg` (el hero), `text-titular` (cada sección), `text-cierre`, `text-frase` y `text-frase-etiqueta` ("Para quiénes"), `text-bajada` (21px). Crecen con la pantalla (`clamp`) hasta el tamaño del diseño en 1440px. `tracking-marca` (−0,045em) es la interletra del logo y de los titulares; `contorno-texto` pone el contorno tinta a letras de color ("Organícenlo") |
| Espaciado (grilla de 4px) | `p-4` = `espacio-4`, `gap-8` = `espacio-8`; medidas: `min-h-toque` (44), `min-h-control` (50), `h-nav` (68) |
| Contornos | `trazo-fino` (2px), `trazo` (2,5px), `trazo-grueso` (3,5px) y por lado: `trazo-b`, `trazo-t`, `trazo-r`, `trazo-grueso-b`… El color es siempre tinta |
| Breakpoints | `md` (768), `lg` (1024), `xl` (1280); contenido con `max-w-contenido` (1200) |
| Movimiento | `motion-safe:animate-bob`, `animate-jump`, `animate-cinta`, `animate-asoma`; en la landing también `animate-repisa` (la repisa del cierre y Vuelto en Gastos) y `barras-se-llenan` (las barras de votación); `ease-rebote` |

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

## 8. La landing

Es la única página donde los pinz son protagonistas. El fondo es `papel` de punta a punta y las secciones no llevan color propio: las separan las cintas de destinos y el camino. Mobile primero; desde `lg` (1024) cada sección pasa a su versión desktop.

| Sección | Archivo |
| --- | --- |
| Barra superior | `BarraLanding.tsx` (fija al hacer scroll; en mobile, solo Ingresar) |
| Hero: titular, botones, navegador y celular con Hoy | `Hero.tsx` (en mobile, solo el celular) |
| Cintas de destinos cruzadas | `CintaDestinos.tsx` |
| Del caos del chat a un solo lugar | `ElProblema.tsx` |
| Todo el viaje, ordenado (bento) | `Funciones.tsx` (en mobile, sin la card de Hoy) |
| Pinz cambia con el viaje | `TresEtapas.tsx` |
| Cada uno, su pinz | `ElegiTuPinz.tsx` (en mobile, nueve pinz en tres columnas) |
| Para quiénes | `ParaQuienes.tsx` |
| ¿Dudas? | `Preguntas.tsx` (en mobile, el bloque de contacto va al final) |
| Cierre y repisa | `Cierre.tsx` |
| Pie | `Pie.tsx` |

`Seccion.tsx` tiene las piezas comunes: `Seccion` (ancho de contenido y por encima del camino), `Pausa`, `Titular`, `Bajada`, `Sobretitulo` y la clase `TARJETA`.

### El camino

La ruta celeste que recorre la página por detrás del contenido y termina en una plataforma bajo el botón "Organizá tu viaje".

- **Componente:** `components/landing/Camino.tsx`. Mide la landing, arma el `path` y lo dibuja en dos trazos (borde y relleno `cielo`) intercalados con la plataforma. No lleva sombra corrida: así el borde tiene el mismo grosor en toda la curva. Se recalcula con un `ResizeObserver` sobre la landing; desde 1024px usa los datos de desktop y por debajo los de mobile.
- **Cálculo:** `lib/camino.ts` (`armarCamino`), una función pura: guía → remuestreo → suavizado gaussiano → nodos → Catmull-Rom. Las x se escalan del ancho del diseño al de la pantalla.
- **Datos:** `lib/caminoDatos.ts`, los puntos guía del diseño, los grosores y quiénes caminan.
- **Anclas:** cada tramo sigue a un elemento con `data-camino`: las pausas `banda1`…`banda5` (los espacios vacíos entre secciones, `Pausa` en `Seccion.tsx`), las cards `b-iti` y `b-hoy` del bento y el botón `cta`. Si una sección cambia de alto, el camino se acomoda solo. En mobile no hay `banda4` (entre el elenco y "Para quiénes") y la pausa del cierre es `banda5`, igual que en desktop.
- **Rodeo de la barra:** un segundo camino, corto y con sus propios pinz (`rodeo.caminantes`), es un solo arco que baja desde el borde superior, pasa por debajo de los botones de acceso (`data-camino="acceso"` en `BarraLanding.tsx`) y sale horizontal por la derecha. Lo arma `armarRodeo` desde el borde real de los botones, con los valores de `rodeo` en `lib/caminoDatos.ts`. En desktop baja menos si el título le queda debajo; la entrada se achica si el menú está cerca y, si aun así no rodea los botones, no se dibuja.
- **Al cargar:** el camino se mide antes del primer cuadro y se dibuja solo (`animate-trazar`). Los pinz que abren la marcha entran enseguida y el resto de a un grupo, con el dibujo terminado: montarlos juntos traba la página. Las fuentes latinas se precargan en `index.html` para que el texto no cambie de tipografía a la vista.
- **Pinz que caminan:** siguen el mismo `path` con una animación de `transform` que arma `Camino` (`cuadrosDelRecorrido`), punto por punto desde `recorrido` (las mismas cúbicas del `d`, cada `PASO_RECORRIDO` px). Así los anima el navegador fuera del hilo principal; con `offset-path` se trababan cuando la página tenía otra tarea. Van en grupos de uno, dos o tres, dando pasitos (`animate-paso`). La lista de `caminantes` se repite a lo largo del camino según `separacionGrupos` (`repartirGrupos` en `lib/camino.ts`), para que siempre haya alguno a la vista. Al llegar al botón final estallan en una nube de humo (`animate-llegada` y `animate-humo`). Los que quedan fuera de pantalla se pausan y retoman donde corresponde (`useCaminantesEnPantalla`), porque sus animaciones corren aunque no se vean. Con `prefers-reduced-motion` el camino queda dibujado y cada grupo, quieto en su tramo.

## 9. Cómo conectar el backend

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
| | `archivoDocumento(id)` | `File` (con nombre y tipo), para `VistaArchivo` |
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
| Mapa | `components/slots/MapaSlot.tsx` | `puntos: { id, nombre, lat, lng, tipo }[]`, `personas: { id, nombre, pinz, lat, lng }[]`, `contenedorRef`, `alto` | `onSeleccionarPunto(id)` | `pages/viaje/resumen/Hoy.tsx`, `pages/viaje/Agenda.tsx` |
| Saldos | `components/slots/SaldosSlot.tsx` | `saldos: { persona, monto }[]` ya calculados (o `null`), `moneda` | `onRegistrarPago(personaId)` | `pages/viaje/Cuentas.tsx`, `pages/viaje/resumen/ResumenPostViaje.tsx` |
| Auth | `components/slots/AuthSlot.tsx` | `estado` (`listo` · `cargando` · `error`) | `onElegirProveedor('google' \| 'mail')` | `pages/ingresar/Ingresar.tsx` |
| Archivos | `components/slots/ArchivosSlot.tsx` | `archivos: { id, nombre, tipo, tamano }[]`, `ayuda` | `onSubir(archivo)`, `onAbrir(archivo)` | `pages/viaje/Baul.tsx`, `pages/vos/Vos.tsx` |
| Comprobante | `components/slots/ComprobanteSlot.tsx` | — | `onEscanear(archivo)` | `pages/viaje/Cuentas.tsx` |
| QR | `components/slots/QrSlot.tsx` | `valor` (link de invitación) | — | `pages/viaje/Grupo.tsx` |

Mientras no estén conectados, muestran `EsperaSlot`: un recuadro punteado que dice qué va ahí. Nunca simulan el contenido real. La librería de mapas se monta en el elemento de `contenedorRef`, que tiene tamaño fijo. El cálculo de saldos lo hace siempre el backend; el front solo los ordena (primero lo que tenés que poner, después lo que te deben, al final con quién estás a mano).

## 10. Convenciones

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

## 11. Pendientes

- **"Escribinos"** en la landing (`pages/landing/Preguntas.tsx`): falta definir el canal de contacto (mail o formulario). Hasta entonces el botón está deshabilitado.
- **Privacidad y Términos:** el diseño los pone en el pie de la landing, pero todavía no hay páginas. Se suman a `Pie.tsx` cuando existan.
- **Mapa, QR, lectura de comprobantes, login y archivos:** son slots. Esperan la librería o el backend.
- **Últimos movimientos:** `api/` manda `cuando` armado y solo en horas, y `cuandoEnDias` (`lib/fechas.ts`) lo pasa a días leyendo ese texto. Lo prolijo es que el backend mande la fecha o el texto final; ahí se borra esa función.
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
- Los tokens que cambian con el tema están en `@theme inline` y leen variables crudas (`--papel`, `--tinta`, `--contorno`, `--sombra`…) definidas en `:root` y en `[data-tema="oscuro"]`. Los pastel no cambian.
- En oscuro la app es negra (`papel` #000), con superficies en gris muy oscuro y trazo y sombra en gris. Los colores de la marca son los mismos que en claro: todo lo que tiene una clase `*-tinte` es automáticamente una isla clara, con su texto oscuro (la regla está en `index.css`). `FONDO_DESTACADO` usa el color puro con `tema-claro`.
- `tinta` es el texto, `contorno` el trazo y `--sombra` la sombra dura (`shadow-chica`, `shadow-dura`, `shadow-grande`). Para bordes se usa `contorno`, nunca `tinta`.
- `tema-claro` marca una isla que vuelve a la paleta clara: los dibujos (`Pin`, `AvatarStack`, logo) y todo lo que tiene relleno pastel, para que su texto siga oscuro.
- La variante `oscuro:` es para lo que un token no resuelve, como `FONDO_DESTACADO` en `pinz/tonos.ts` para bloques grandes.
- La landing siempre se ve en claro (`useSoloClaro`).
