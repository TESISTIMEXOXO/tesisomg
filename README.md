# Pinz

Web (React + Vite) y API (Express + MongoDB), todo en Docker.

## Arrancar

1. Copiá `.env.example` como `.env` y completalo (ver abajo). El `.env` no se sube a Git.
2. `docker compose up -d --build`
3. Web: http://localhost:5173 · API: http://localhost:4000

Después de cambiar el `.env`: `docker compose up -d`.

## Variables del `.env`

| Variable | Qué es |
|---|---|
| `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DB` | Usuario, contraseña y base de Mongo local. La contraseña la elige cada uno. Mongo la guarda al crear la base por primera vez: si después la cambiás en el `.env`, también hay que cambiarla adentro de Mongo. |
| `SESION_SECRETO` | Firma las cookies de sesión. En desarrollo puede quedar vacío; en producción es obligatorio (`openssl rand -base64 32`). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Ingreso con Google. Si quedan vacías, el botón avisa que no está disponible. |
| `SMTP_URL`, `MAIL_FROM` | Mail para los códigos de crear cuenta y de cambiar la contraseña. Si quedan vacías, el código se muestra en `docker compose logs -f api`. |

### Google

En [console.cloud.google.com](https://console.cloud.google.com), Google Auth Platform:

1. **Público**: tipo *Externo*; en *Usuarios de prueba* agregá los Gmail que van a probar.
2. **Clientes** → *Crear cliente* → *Aplicación web*. En *Orígenes autorizados de JavaScript* agregá `http://localhost:5173`. No hace falta ningún URI de redireccionamiento.
3. Copiá el ID de cliente y el secreto al `.env`.

### Mail

En `SMTP_URL`, la `@` del usuario va como `%40`.

**Brevo** (lo que usa el proyecto): en app.brevo.com → *SMTP y API* → *SMTP* copiá el login y generá una clave SMTP. El remitente tiene que estar confirmado en [Remitentes](https://app.brevo.com/senders/list).

```
SMTP_URL=smtp://LOGIN%40smtp-brevo.com:CLAVESMTP@smtp-relay.brevo.com:587
MAIL_FROM=Pinz <pinz.tesis@gmail.com>
```

**Gmail**: activá la verificación en 2 pasos y creá una contraseña de aplicación en https://myaccount.google.com/apppasswords (va sin espacios).

```
SMTP_URL=smtps://tumail%40gmail.com:clavedeaplicacion@smtp.gmail.com:465
MAIL_FROM=Pinz <tumail@gmail.com>
```

## Base de datos

Mongo corre en el contenedor `pinz-db-1`, puerto 27017, base `pinz` (la que diga `MONGO_DB`). Para abrirla con Compass o mongosh:

```
mongodb://MONGO_USER:MONGO_PASSWORD@localhost:27017/MONGO_DB?authSource=admin
```

### `usuarios`: una por cuenta (`api/src/modelos/Usuario.ts`)

| Campo | Qué es |
|---|---|
| `email` | Único, en minúsculas. |
| `nombre` | Vacío hasta que pasa por `/bienvenida`. |
| `pinz` | Personaje elegido (chispa, brujula, vuelto, siesta, valija, postal, nono, trasnoche, morfi, cumbre) o `null`. |
| `moneda` | `ARS` \| `USD` \| `UYU` \| `CLP` \| `BRL` (por defecto `ARS`). |
| `contrasenaHash` | Contraseña hasheada con scrypt; `null` si sólo entra con Google. |
| `proveedores.google` | Id de la cuenta de Google, si entró con Google. |
| `preferencias` | `presupuestoPorNoche`, `ritmo`, `comida`, `alergias`. Todavía no hay pantalla para cargarlas. |
| `aeropuertos` | Desde dónde sale de viaje (se muestra en "Vos"). Todavía no hay pantalla para cargarlos. |
| `createdAt` / `updatedAt` | Fechas automáticas. |

### `codigoverificacions`: códigos de 6 dígitos mandados por mail (`api/src/modelos/CodigoVerificacion.ts`)

Hay uno solo por email y propósito: pedir otro reemplaza al anterior. El nombre lo arma Mongoose (agrega una "s" al modelo).

| Campo | Qué es |
|---|---|
| `email` | A quién se mandó. |
| `proposito` | `registro` (crear cuenta) \| `recuperar` (olvidé mi contraseña). |
| `codigoHash` | El código hasheado; el número nunca se guarda. |
| `contrasenaHash` | En el registro, la contraseña elegida hasta que se confirme. |
| `intentos` | Errores hasta ahora. Al quinto se borra. |
| `venceEn` | Mongo lo borra solo a los 10 minutos. |

### Sesión

No se guarda en la base: es la cookie `pinz_sesion` (httpOnly, dura 30 días).
