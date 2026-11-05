import type { DocViaje } from "./modelos/Viaje.js";

/**
 * Tres strikes: a la tercera vez que sacan a alguien del mismo viaje, ya no puede volver a sumarse, ni con
 * el link guardado ni con una invitación nueva. Las dos primeras dejan margen por si fue un error.
 */
export const MAX_EXPULSIONES = 3;

/** Cuántas veces sacaron a esa persona de este viaje. */
export function vecesSacado(viaje: Pick<DocViaje, "expulsados">, usuarioId: string) {
  return viaje.expulsados.find((expulsado) => expulsado.usuarioId.toString() === usuarioId)?.veces ?? 0;
}

export function estaBaneado(viaje: Pick<DocViaje, "expulsados">, usuarioId: string) {
  return vecesSacado(viaje, usuarioId) >= MAX_EXPULSIONES;
}
