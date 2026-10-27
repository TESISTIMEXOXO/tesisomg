/** Todo lo que se lee del entorno, en un solo lugar. */

function requerida(nombre: string) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

const produccion = process.env.NODE_ENV === "production";

export const config = {
  produccion,
  puerto: Number(process.env.PORT) || 4000,
  mongoUri: requerida("MONGODB_URI"),
  /** Dónde vive el front: CORS. */
  webUrl: process.env.WEB_URL || process.env.CORS_ORIGIN || "http://localhost:5173",
  /** Firma las cookies de sesión. En desarrollo hay uno fijo para no trabar a nadie. */
  sesionSecreto: produccion ? requerida("SESION_SECRETO") : process.env.SESION_SECRETO || "desarrollo-no-usar-en-produccion",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  mail: {
    /** smtp://usuario:clave@host:587. Sin esto, el código de ingreso se muestra en la consola. */
    smtpUrl: process.env.SMTP_URL,
    remitente: process.env.MAIL_FROM || "Pinz <hola@pinz.app>",
  },
};
