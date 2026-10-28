import { Router } from "express";
import { z } from "zod";
import { requiereSesion } from "../auth/sesion.js";
import { MONEDAS, PINZ_IDS, Usuario, type DocUsuario } from "../modelos/Usuario.js";

export const rutasPerfil = Router();
rutasPerfil.use(requiereSesion);

const DatosPerfilSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  pinz: z.enum(PINZ_IDS).nullable(),
  moneda: z.enum(MONEDAS),
});

/** Con la forma de PerfilSchema del front. */
function perfilPublico(usuario: DocUsuario) {
  return {
    id: usuario.id as string,
    nombre: usuario.nombre,
    pinz: usuario.pinz ?? null,
    moneda: usuario.moneda,
    preferencias: {
      presupuestoPorNoche: usuario.preferencias?.presupuestoPorNoche ?? null,
      ritmo: usuario.preferencias?.ritmo ?? null,
      comida: usuario.preferencias?.comida ?? null,
      alergias: usuario.preferencias?.alergias ?? null,
    },
    aeropuertos: usuario.aeropuertos,
    // Se llena cuando existan los viajes en el backend.
    historial: [],
  };
}

rutasPerfil.get("/", async (_req, res) => {
  const usuario = await Usuario.findById(res.locals.usuarioId);
  if (!usuario) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(perfilPublico(usuario));
});

rutasPerfil.put("/", async (req, res) => {
  const datos = DatosPerfilSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuario = await Usuario.findByIdAndUpdate(res.locals.usuarioId, { $set: datos.data }, { new: true });
  if (!usuario) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(perfilPublico(usuario));
});
