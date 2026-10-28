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

rutasLugares.get("/", async (req, res) => {
  const consulta = z.string().trim().min(3).max(100).safeParse(req.query.q);
  if (!consulta.success) {
    res.status(400).json({ error: "consulta-invalida" });
    return;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", consulta.data);
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
  res.json(resultado.data.map((lugar) => ({
    id: lugar.place_id.toString(),
    nombre: lugar.name || lugar.address?.city || lugar.address?.town || lugar.address?.village || lugar.address?.municipality || lugar.display_name.split(",")[0],
    detalle: lugar.display_name,
    lat: Number(lugar.lat),
    lng: Number(lugar.lon),
  })));
});
