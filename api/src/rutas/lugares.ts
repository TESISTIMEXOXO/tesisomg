import { Router } from "express";
import { z } from "zod";

export const rutasLugares = Router();

let ultimaConsulta = 0;
let colaConsultas = Promise.resolve();

async function consultarGeocodificador(url: URL) {
  let liberar: () => void = () => {};
  const anterior = colaConsultas;
  colaConsultas = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  await anterior;
  try {
    const espera = Math.max(0, 1100 - (Date.now() - ultimaConsulta));
    if (espera) await new Promise((resolver) => setTimeout(resolver, espera));
    ultimaConsulta = Date.now();
    const respuesta = await fetch(url, {
      headers: { "User-Agent": "PinzTravelPlanner/1.0 (https://pinz.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!respuesta.ok) throw new Error(`El servicio de mapas respondió HTTP ${respuesta.status}.`);
    return await respuesta.json();
  } finally {
    liberar();
  }
}

/* Algunas redes no llegan a Nominatim. Si falla, se usa Photon (también OpenStreetMap) por un rato
   para no esperar el timeout en cada búsqueda. */
const PAUSA_NOMINATIM_MS = 10 * 60 * 1000;
let nominatimFalloEn = 0;

rutasLugares.get("/", async (req, res) => {
  const consulta = z.string().trim().min(3).max(100).safeParse(req.query.q);
  if (!consulta.success) {
    res.status(400).json({ error: "consulta-invalida" });
    return;
  }

  if (Date.now() - nominatimFalloEn > PAUSA_NOMINATIM_MS) {
    try {
      res.json(await buscarEnNominatim(consulta.data));
      return;
    } catch (error) {
      nominatimFalloEn = Date.now();
      console.warn("Nominatim no respondió, se usa Photon", error);
    }
  }
  res.json(await buscarEnPhoton(consulta.data));
});

/** El país de unas coordenadas, para Emergencias. Responde el código ISO (en mayúsculas) y el nombre. */
rutasLugares.get("/pais", async (req, res) => {
  const coordenadas = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }).safeParse(req.query);
  if (!coordenadas.success) {
    res.status(400).json({ error: "coordenadas-invalidas" });
    return;
  }
  try {
    res.json(await paisEn(coordenadas.data.lat, coordenadas.data.lng));
  } catch {
    res.status(502).json({ error: "sin-geocodificador" });
  }
});

type Pais = { codigo: string | null; nombre: string | null };

/*
 * Los países no se mudan: lo ya averiguado se guarda en memoria, por coordenadas redondeadas a ~1 km.
 * Así el feed del calendario, que Google pide seguido, no le pega a Nominatim cada vez.
 */
const paisesConocidos = new Map<string, Pais>();
const MAX_PAISES_CONOCIDOS = 5000;

/** El país de unas coordenadas: Nominatim y, si no responde, Photon. Tira error si no responde ninguno. */
export async function paisEn(lat: number, lng: number): Promise<Pais> {
  const clave = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const conocido = paisesConocidos.get(clave);
  if (conocido) return conocido;

  let pais: Pais | null = null;
  if (Date.now() - nominatimFalloEn > PAUSA_NOMINATIM_MS) {
    try {
      pais = await paisEnNominatim(lat, lng);
    } catch (error) {
      nominatimFalloEn = Date.now();
      console.warn("Nominatim no respondió, se usa Photon", error);
    }
  }
  if (!pais) {
    try {
      pais = await paisEnPhoton(lat, lng);
    } catch (error) {
      console.warn("Photon tampoco respondió", error);
      throw error;
    }
  }
  if (paisesConocidos.size >= MAX_PAISES_CONOCIDOS) paisesConocidos.clear();
  paisesConocidos.set(clave, pais);
  return pais;
}

/** Sin país (en el mar, por ejemplo) responde codigo null. */
async function paisEnNominatim(lat: number, lng: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "3");
  url.searchParams.set("accept-language", "es");

  const resultado = z.object({
    address: z.object({ country: z.string().optional(), country_code: z.string().optional() }).optional(),
  }).safeParse(await consultarGeocodificador(url));
  if (!resultado.success) {
    throw new Error("El servicio de mapas devolvió resultados con un formato inesperado.");
  }
  const direccion = resultado.data.address;
  return { codigo: direccion?.country_code?.toUpperCase() ?? null, nombre: direccion?.country ?? null };
}

async function paisEnPhoton(lat: number, lng: number) {
  const url = new URL("https://photon.komoot.io/reverse");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());

  const respuesta = await fetch(url, {
    headers: { "User-Agent": "PinzTravelPlanner/1.0 (https://pinz.app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!respuesta.ok) throw new Error(`El servicio de mapas respondió HTTP ${respuesta.status}.`);

  const resultado = z.object({
    features: z.array(z.object({
      properties: z.object({ country: z.string().optional(), countrycode: z.string().optional() }),
    })),
  }).safeParse(await respuesta.json());
  if (!resultado.success) {
    throw new Error("El servicio de mapas devolvió resultados con un formato inesperado.");
  }
  const lugar = resultado.data.features[0]?.properties;
  return { codigo: lugar?.countrycode?.toUpperCase() ?? null, nombre: lugar?.country ?? null };
}

async function buscarEnNominatim(consulta: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");

  const resultado = z.array(z.object({
    place_id: z.number(),
    name: z.string().optional(),
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
    address: z.object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      municipality: z.string().optional(),
    }).optional(),
  })).safeParse(await consultarGeocodificador(url));
  if (!resultado.success) {
    throw new Error("El servicio de mapas devolvió resultados con un formato inesperado.");
  }
  return resultado.data.map((lugar) => ({
    id: lugar.place_id.toString(),
    nombre: lugar.name || lugar.address?.city || lugar.address?.town || lugar.address?.village || lugar.address?.municipality || lugar.display_name.split(",")[0],
    detalle: lugar.display_name,
    lat: Number(lugar.lat),
    lng: Number(lugar.lon),
  }));
}

/** Solo ciudades, provincias y países: sin las capas chicas aparecen campos y barrios antes que la ciudad. */
async function buscarEnPhoton(consulta: string) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", consulta);
  url.searchParams.set("limit", "6");
  for (const capa of ["city", "state", "country"]) url.searchParams.append("layer", capa);

  const respuesta = await fetch(url, {
    headers: { "User-Agent": "PinzTravelPlanner/1.0 (https://pinz.app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!respuesta.ok) throw new Error(`El servicio de mapas respondió HTTP ${respuesta.status}.`);

  const resultado = z.object({
    features: z.array(z.object({
      properties: z.object({
        osm_type: z.string(),
        osm_id: z.number(),
        name: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      }),
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
    })),
  }).safeParse(await respuesta.json());
  if (!resultado.success) {
    throw new Error("El servicio de mapas devolvió resultados con un formato inesperado.");
  }
  return resultado.data.features
    .filter((lugar) => lugar.properties.name)
    .map(({ properties: p, geometry }) => ({
      id: `${p.osm_type}${p.osm_id}`,
      nombre: p.name!,
      detalle: [p.name, p.state, p.country].filter((parte, i, partes) => parte && partes.indexOf(parte) === i).join(", "),
      lat: geometry.coordinates[1],
      lng: geometry.coordinates[0],
    }));
}
