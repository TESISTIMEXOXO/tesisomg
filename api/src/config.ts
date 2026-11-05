/** Todo lo que se lee del entorno, en un solo lugar. */

function requerida(nombre: string) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

const produccion = process.env.NODE_ENV === "production";
const mongoUri = process.env.MONGODB_URI?.trim()
  || (produccion
    ? requerida("MONGODB_URI")
    : `mongodb://${encodeURIComponent(process.env.MONGO_USER || "px")}:${encodeURIComponent(process.env.MONGO_PASSWORD || "cambiame")}@db:27017/${encodeURIComponent(process.env.MONGO_DB || "px")}?authSource=admin`);

export const config = {
  produccion,
  puerto: Number(process.env.PORT) || 4000,
  mongoUri,
  /** Dónde vive el front: CORS. */
  webUrl: process.env.WEB_URL || process.env.CORS_ORIGIN || "http://localhost:5173",
  /**
   * Desde dónde llega el navegador a la API (https://api.pinz.app): arma el link del calendario al que se
   * suscriben Google y el iPhone. Sin esto, se usa el host del pedido.
   */
  apiUrlPublica: process.env.API_URL_PUBLICA?.trim() || null,
  /** Firma las cookies de sesión. En desarrollo hay uno fijo para no trabar a nadie. */
  sesionSecreto: produccion ? requerida("SESION_SECRETO") : process.env.SESION_SECRETO || "desarrollo-no-usar-en-produccion",
  superadminEmail: "pinz.tesis@gmail.com",
  /** Lee los comprobantes con Claude. Sin esto, el botón de escanear avisa que no está disponible. */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  mail: {
    /** smtp://usuario:clave@host:587. Sin esto, el código de ingreso se muestra en la consola. */
    smtpUrl: process.env.SMTP_URL,
    remitente: process.env.MAIL_FROM || "Pinz <hola@pinz.app>",
    /** A dónde llega el aviso de cada consulta de "Escribinos". Sin esto, al mismo remitente. */
    equipo: process.env.CONTACTO_EQUIPO || process.env.MAIL_FROM || "Pinz <hola@pinz.app>",
  },
};
