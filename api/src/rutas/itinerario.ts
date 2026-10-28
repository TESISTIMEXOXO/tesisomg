import { Router } from "express";
import { z } from "zod";
import { puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasItinerario = Router({ mergeParams: true });

const ActividadSchema = z.object({
  fecha: z.iso.date(),
  hora: z.iso.time({ precision: -1 }),
  titulo: z.string().trim().min(1).max(120),
  lugar: z.string().trim().max(160).nullable(),
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
    titulo: item.titulo,
    lugar: item.lugar ?? null,
    estado,
  };
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

rutasItinerario.get("/calendario", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const escapar = (texto: string) => texto.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const fechaFlotante = (fecha: Date) => `${fecha.toISOString().slice(0, 16).replace(/[-:]/g, "")}00`;
  const eventos = viaje.itinerario.map((item) => {
    const inicio = new Date(`${item.fecha}T${item.hora}:00Z`);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    return [
      "BEGIN:VEVENT",
      `UID:${item.id}@pinz`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART:${fechaFlotante(inicio)}`,
      `DTEND:${fechaFlotante(fin)}`,
      `SUMMARY:${escapar(item.titulo)}`,
      ...(item.lugar ? [`LOCATION:${escapar(item.lugar)}`] : []),
      "END:VEVENT",
    ].join("\r\n");
  });
  res.type("text/calendar");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(`${viaje.nombre}.ics`)}"`);
  res.send(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pinz//Itinerario//ES", ...eventos, "END:VCALENDAR"].join("\r\n"));
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
  const actividad = { id: crypto.randomUUID(), ...datos.data, hecha: false, lat: null, lng: null };
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
  const inicio = viaje.fechaIda ? new Date(`${viaje.fechaIda}T12:00:00-03:00`) : ahora;
  const final = viaje.fechaVuelta ? new Date(`${viaje.fechaVuelta}T12:00:00-03:00`) : ahora;
  const fechaActual = new Date(`${fecha}T12:00:00-03:00`);
  const diaViaje = Math.max(1, Math.floor((fechaActual.getTime() - inicio.getTime()) / 86_400_000) + 1);
  const totalDias = Math.max(1, Math.floor((final.getTime() - inicio.getTime()) / 86_400_000) + 1);
  const items = viaje.itinerario
    .filter((item) => item.fecha === fecha)
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .map((item) => actividadPublica(item, viaje._id.toString(), fecha, horaActual));
  const puntos = [
    ...(viaje.ubicacion ? [{ id: "destino", nombre: viaje.ubicacion.nombre, lat: viaje.ubicacion.lat, lng: viaje.ubicacion.lng, tipo: "alojamiento" }] : []),
    ...viaje.itinerario
      .filter((item) => item.lat !== null && item.lng !== null)
      .map((item) => ({ id: item.id, nombre: item.lugar ?? item.titulo, lat: item.lat!, lng: item.lng!, tipo: "actividad" })),
  ];
  res.json({
    viajeId: viaje._id.toString(),
    fecha,
    dia: diaViaje,
    totalDias,
    titulo: items[0]?.titulo ?? viaje.destino,
    items,
    puntos,
    ubicaciones: [],
    aviso: null,
  });
});
