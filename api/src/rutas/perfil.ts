import { Router } from "express";
import { z } from "zod";
import { requiereSesion } from "../auth/sesion.js";
import { MONEDAS, PINZ_IDS, Usuario, type DocUsuario } from "../modelos/Usuario.js";
import { Viaje } from "../modelos/Viaje.js";

export const rutasPerfil = Router();
rutasPerfil.use(requiereSesion);

const DatosPerfilSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  pinz: z.enum(PINZ_IDS).nullable(),
  moneda: z.enum(MONEDAS),
  tema: z.enum(["claro", "oscuro", "sistema"]).optional(),
  preferencias: z.object({
    presupuestoPorNoche: z.number().int().nonnegative().nullable(),
    ritmo: z.enum(["tranqui", "intermedio", "a full"]).nullable(),
    comida: z.string().trim().max(200).nullable(),
    alergias: z.string().trim().max(200).nullable(),
  }).optional(),
  aeropuertos: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
});

/** Con la forma de PerfilSchema del front. */
async function perfilPublico(usuario: DocUsuario) {
  const historial = await Viaje.find({
    "miembros.usuarioId": usuario._id,
    fechaVuelta: { $ne: null, $lt: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()) },
  }).select("destino fechaIda").sort({ fechaVuelta: -1 }).exec();
  return {
    id: usuario.id as string,
    nombre: usuario.nombre,
    pinz: usuario.pinz ?? null,
    moneda: usuario.moneda,
    tema: usuario.tema ?? "claro",
    preferencias: {
      presupuestoPorNoche: usuario.preferencias?.presupuestoPorNoche ?? null,
      ritmo: usuario.preferencias?.ritmo ?? null,
      comida: usuario.preferencias?.comida ?? null,
      alergias: usuario.preferencias?.alergias ?? null,
    },
    aeropuertos: usuario.aeropuertos,
    historial: historial.filter((viaje) => viaje.fechaIda).map((viaje) => ({
      viajeId: viaje.id,
      destino: viaje.destino,
      fecha: viaje.fechaIda!,
    })),
  };
}

rutasPerfil.get("/", async (_req, res) => {
  const usuario = await Usuario.findById(res.locals.usuarioId);
  if (!usuario) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(await perfilPublico(usuario));
});

rutasPerfil.put("/", async (req, res) => {
  const datos = DatosPerfilSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuario = await Usuario.findById(res.locals.usuarioId);
  if (!usuario) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const { nombre, pinz, moneda, tema, preferencias, aeropuertos } = datos.data;
  usuario.nombre = nombre;
  usuario.pinz = pinz;
  usuario.moneda = moneda;
  if (tema) usuario.tema = tema;
  if (preferencias) usuario.preferencias = { ...usuario.preferencias, ...preferencias };
  if (aeropuertos) usuario.aeropuertos = aeropuertos;
  await usuario.save();
  await Viaje.updateMany(
    { "miembros.usuarioId": usuario._id },
    { $set: { "miembros.$[miembro].nombre": usuario.nombre, "miembros.$[miembro].pinz": usuario.pinz } },
    { arrayFilters: [{ "miembro.usuarioId": usuario._id }] },
  );
  res.json(await perfilPublico(usuario));
});
