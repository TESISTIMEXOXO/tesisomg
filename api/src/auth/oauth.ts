import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";

/** Lo que Google confirma de la persona después de verificar su id_token. */
export type IdentidadGoogle = { id: string; email: string; nombre?: string };

const google = {
  token: "https://oauth2.googleapis.com/token",
  claves: createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")),
  emisores: ["https://accounts.google.com", "accounts.google.com"],
};

export function googleConfigurado() {
  return Boolean(config.google.clientId && config.google.clientSecret);
}

/**
 * El front abre la ventanita de Google (la que lista las cuentas abiertas en el navegador) y nos pasa el código.
 * Acá se canjea por un id_token, se verifica su firma y se devuelve quién es la persona.
 * "postmessage" es el redirect_uri que exige Google cuando el código llega por la ventanita y no por un redirect.
 */
export async function identidadDesdeCodigo(code: string): Promise<IdentidadGoogle> {
  const respuesta = await fetch(google.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId!,
      client_secret: config.google.clientSecret!,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    }),
  });
  if (!respuesta.ok) throw new Error(`Google rechazó el código (${respuesta.status}): ${await respuesta.text()}`);
  const { id_token: idToken } = (await respuesta.json()) as { id_token?: string };
  if (!idToken) throw new Error("Google no devolvió id_token");

  const { payload } = await jwtVerify(idToken, google.claves, { issuer: google.emisores, audience: config.google.clientId! });
  if (typeof payload.email !== "string" || payload.email_verified !== true || !payload.sub) {
    throw new Error("Google no confirmó el mail");
  }
  return { id: payload.sub, email: payload.email, ...(typeof payload.given_name === "string" && { nombre: payload.given_name }) };
}
