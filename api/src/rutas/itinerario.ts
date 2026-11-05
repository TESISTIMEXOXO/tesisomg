import { randomBytes } from "node:crypto";
import { Router, type Request } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { armarCalendario, nombreDeArchivo } from "../calendario/ics.js";
import { etapaDelDia, zonasDeLasEtapas } from "../calendario/zonas.js";
import { config } from "../config.js";
import { Viaje, type DocViaje } from "../modelos/Viaje.js";
import { etapasDelViaje, puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasItinerario = Router({ mergeParams: true });
/** Sin sesión: el feed al que se suscriben los calendarios. Va montado fuera de requiereSesion. */
export const rutasCalendarioPublico = Router();

const HORA = z.iso.time({ precision: -1 });

const ActividadSchema = z.object({
  fecha: z.iso.date(),
  hora: HORA,
  horaFin: HORA.nullable().default(null),
  titulo: z.string().trim().min(1).max(120),
  lugar: z.string().trim().max(160).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
}).refine((actividad) => (actividad.lat === null) === (actividad.lng === null), {
  message: "La latitud y longitud deben informarse juntas.",
}).refine((actividad) => actividad.horaFin === null || actividad.horaFin > actividad.hora, {
  message: "La hora de fin tiene que ser después de la de inicio.",
  path: ["horaFin"],
});

function actividadPublica(
  item: (NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>["itinerario"])[number],
  viajeId: string,
  hoy: string,
  horaActual: string,
) {
  const estado = item.hecha ? "hecho" : item.fecha === hoy && item.hora <= horaActual ? "ahora" : "pendiente";
  return {
    id: item.id,
    viajeId,
    fecha: item.fecha,
    hora: item.hora,
    horaFin: item.horaFin ?? null,
    titulo: item.titulo,
    lugar: item.lugar ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    estado,
  };
}

/** Cada actividad va con la zona del destino de su día, para que Google y el iPhone la pongan a la hora correcta. */
async function calendarioDelViaje(viaje: DocViaje) {
  const etapas = etapasDelViaje(viaje);
  const zonas = await zonasDeLasEtapas(etapas);
  const itinerario = viaje.itinerario.map((actividad) => {
    const indice = etapaDelDia(etapas, actividad.fecha);
    return {
      id: actividad.id,
      fecha: actividad.fecha,
      hora: actividad.hora,
      horaFin: actividad.horaFin,
      titulo: actividad.titulo,
      lugar: actividad.lugar,
      zona: indice === null ? null : (zonas[indice] ?? null),
    };
  });
  return armarCalendario(
    { id: viaje._id.toString(), nombre: viaje.nombre, itinerario },
    `${config.webUrl}/viajes/${viaje._id.toString()}/agenda`,
  );
}

/** Desde dónde llega el navegador a la API: API_URL_PUBLICA o, sin ella, el host del pedido. */
function baseApiPublica(req: Request) {
  return (config.apiUrlPublica || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
}

rutasItinerario.get("/", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  const horaActual = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  res.json(viaje.itinerario.map((item) => actividadPublica(item, viaje._id.toString(), hoy, horaActual)));
});

/** La descarga del .ics, una sola vez (no se actualiza). */
rutasItinerario.get("/calendario", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.type("text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(nombreDeArchivo(viaje.nombre))}`);
  res.send(await calendarioDelViaje(viaje));
});

/** El link de suscripción de quien lo pide: el token se crea la primera vez y después se reusa. */
rutasItinerario.post("/calendario/enlace", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  const miembro = viaje?.miembros.find((persona) => persona.usuarioId.toString() === usuarioId);
  if (!viaje || !miembro) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  let token = miembro.calendarioToken;
  if (!token) {
    // Solo si sigue sin token: si se pidió dos veces a la vez, gana el primero y los dos usan ese.
    await Viaje.updateOne(
      { _id: viaje._id, miembros: { $elemMatch: { usuarioId: new mongoose.Types.ObjectId(usuarioId), calendarioToken: { $exists: false } } } },
      { $set: { "miembros.$.calendarioToken": randomBytes(32).toString("base64url") } },
    );
    const actualizado = await Viaje.findById(viaje._id).select("miembros").exec();
    token = actualizado?.miembros.find((persona) => persona.usuarioId.toString() === usuarioId)?.calendarioToken;
  }
  if (!token) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json({ url: `${baseApiPublica(req)}/calendario/${token}.ics` });
});

rutasItinerario.post("/", async (req, res) => {
  const datos = ActividadSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const actividad = { id: crypto.randomUUID(), ...datos.data, hecha: false };
  viaje.itinerario.push(actividad);
  await viaje.save();
  const creada = viaje.itinerario.find((item) => item.id === actividad.id)!;
  res.status(201).json(actividadPublica(creada, viaje._id.toString(), "", ""));
});

rutasItinerario.get("/hoy", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const ahora = new Date();
  const fecha = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(ahora);
  const horaActual = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ahora);
  const etapas = etapasDelViaje(viaje);
  const etapaDeHoy = etapas.find((etapa) => etapa.fechaIda && etapa.fechaVuelta && etapa.fechaIda <= fecha && etapa.fechaVuelta >= fecha);
  const fechaIda = etapas.find((etapa) => etapa.fechaIda)?.fechaIda ?? viaje.fechaIda;
  const fechaVuelta = [...etapas].reverse().find((etapa) => etapa.fechaVuelta)?.fechaVuelta ?? viaje.fechaVuelta;
  const inicio = fechaIda ? new Date(`${fechaIda}T12:00:00-03:00`) : ahora;
  const final = fechaVuelta ? new Date(`${fechaVuelta}T12:00:00-03:00`) : ahora;
  const fechaActual = new Date(`${fecha}T12:00:00-03:00`);
  const diaViaje = Math.max(1, Math.floor((fechaActual.getTime() - inicio.getTime()) / 86_400_000) + 1);
  const totalDias = Math.max(1, Math.floor((final.getTime() - inicio.getTime()) / 86_400_000) + 1);
  const items = viaje.itinerario
    .filter((item) => item.fecha === fecha)
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .map((item) => actividadPublica(item, viaje._id.toString(), fecha, horaActual));
  const puntos = [
    ...(etapaDeHoy ? [{
      id: etapaDeHoy.id,
      nombre: etapaDeHoy.destino,
      lat: etapaDeHoy.ubicacion.lat,
      lng: etapaDeHoy.ubicacion.lng,
      tipo: "alojamiento" as const,
    }] : []),
    ...viaje.itinerario
      .filter((item) => item.fecha === fecha && item.lat !== null && item.lng !== null)
      .map((item) => ({ id: item.id, nombre: item.lugar ?? item.titulo, lat: item.lat!, lng: item.lng!, tipo: "actividad" })),
  ];
  res.json({
    viajeId: viaje._id.toString(),
    fecha,
    dia: diaViaje,
    totalDias,
    titulo: items[0]?.titulo ?? etapaDeHoy?.destino ?? viaje.destino,
    items,
    puntos,
    ubicaciones: [],
    aviso: null,
  });
});

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

rutasCalendarioPublico.get("/:token.ics", async (req, res) => {
  const { token } = req.params;
  // Si la persona salió del viaje, su miembro (y su token) ya no está: no se encuentra y es 404.
  const viaje = TOKEN.test(token) ? await Viaje.findOne({ "miembros.calendarioToken": token }).exec() : null;
  if (!viaje) {
    res.status(404).type("text/plain").send("No existe");
    return;
  }
  res.type("text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(nombreDeArchivo(viaje.nombre))}`);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(await calendarioDelViaje(viaje));
});
