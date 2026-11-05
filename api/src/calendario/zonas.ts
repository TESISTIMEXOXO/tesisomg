import { paisEn } from "../rutas/lugares.js";
import { zonaHoraria } from "../zonasHorarias.js";

type Etapa = { fechaIda?: string | null; ubicacion: { lat: number; lng: number } };

/** La zona IANA de cada etapa, en el mismo orden. null si no se pudo averiguar el país o no está en la tabla. */
export async function zonasDeLasEtapas(etapas: Etapa[]) {
  return Promise.all(
    etapas.map(async ({ ubicacion }) => {
      try {
        const { codigo } = await paisEn(ubicacion.lat, ubicacion.lng);
        return zonaHoraria(codigo, ubicacion.lat, ubicacion.lng);
      } catch {
        // Sin geocodificador, la hora va flotante: mejor eso que no servir el calendario.
        return null;
      }
    }),
  );
}

/**
 * En qué etapa se está ese día: la última que ya empezó, igual que en la Agenda del front (etapaDelDia).
 * Antes del viaje o sin fechas, la primera.
 */
export function etapaDelDia(etapas: Etapa[], dia: string) {
  if (!etapas.length) return null;
  const empezadas = etapas.flatMap((etapa, indice) => (etapa.fechaIda && etapa.fechaIda <= dia ? [indice] : []));
  return empezadas.at(-1) ?? 0;
}
