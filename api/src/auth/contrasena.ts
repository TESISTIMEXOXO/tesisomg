import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

const scrypt = promisify(scryptCallback) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO = 64;

/** Las mismas reglas que muestra el front: 6 caracteres como mínimo y al menos una mayúscula. */
export const ContrasenaSchema = z
  .string()
  .min(6)
  .max(128)
  .regex(/\p{Lu}/u);

/** Guarda "sal:hash" en hex. */
export async function hashearContrasena(contrasena: string) {
  const sal = randomBytes(16);
  const hash = await scrypt(contrasena, sal, LARGO);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

export async function contrasenaCoincide(contrasena: string, guardado: string) {
  const [salHex, hashHex] = guardado.split(":");
  const esperado = Buffer.from(hashHex ?? "", "hex");
  const recibido = await scrypt(contrasena, Buffer.from(salHex ?? "", "hex"), LARGO);
  return esperado.length === LARGO && timingSafeEqual(esperado, recibido);
}
