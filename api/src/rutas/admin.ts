import { Router, type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requiereSesion } from "../auth/sesion.js";
import { correoConfigurado, mandarRespuestaConsulta } from "../auth/mail.js";
import { config } from "../config.js";
import { Consulta } from "../modelos/Consulta.js";
import { RespuestaConsulta } from "../modelos/RespuestaConsulta.js";
import { Usuario, type DatosUsuario } from "../modelos/Usuario.js";
import { Viaje } from "../modelos/Viaje.js";

export const rutasAdmin = Router();

async function requiereSuperadmin(_req: Request, res: Response, next: NextFunction) {
  const usuario = await Usuario.findById(res.locals.usuarioId).select("email").exec();
  if (!usuario || usuario.email.toLowerCase() !== config.superadminEmail) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  next();
}

rutasAdmin.use(requiereSesion, requiereSuperadmin);

const paginaSchema = z.coerce.number().int().min(1).default(1);
const busquedaSchema = z.string().trim().max(100).default("");
const ordenSchema = z.enum(["nuevo", "antiguo", "alfabetico"]).default("nuevo");
const POR_PAGINA = 5;
const USUARIOS_POR_PAGINA = 10;

function paginacion(req: Request, res: Response) {
  const resultado = paginaSchema.safeParse(req.query.pagina);
  if (!resultado.success) {
    res.status(400).json({ error: "pagina-invalida" });
    return null;
  }
  return resultado.data;
}

/** Lee ?q= y ?orden= de las listas del panel. El texto vuelve escapado, listo para un $regex. */
function busquedaYOrden(req: Request, res: Response) {
  const busqueda = busquedaSchema.safeParse(req.query.q);
  if (!busqueda.success) {
    res.status(400).json({ error: "busqueda-invalida" });
    return null;
  }
  const orden = ordenSchema.safeParse(req.query.orden);
  if (!orden.success) {
    res.status(400).json({ error: "orden-invalido" });
    return null;
  }
  return { texto: busqueda.data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), orden: orden.data };
}

/** Busca el texto, sin distinguir mayúsculas, en cualquiera de los campos. Sin texto no filtra. */
function buscarEn(campos: string[], texto: string) {
  return texto ? { $or: campos.map((campo) => ({ [campo]: { $regex: texto, $options: "i" } })) } : {};
}

/** Para el orden alfabético: sin distinguir mayúsculas ni tildes. */
const ORDEN_ESPANOL = { locale: "es", strength: 1 };

/** nuevo y antiguo van por fecha de creación; alfabético, por el campo que se pase. */
function ordenarPor(orden: z.infer<typeof ordenSchema>, campoAlfabetico: string) {
  if (orden === "alfabetico") return { [campoAlfabetico]: 1 as const, _id: 1 as const };
  const sentido = orden === "nuevo" ? -1 as const : 1 as const;
  return { createdAt: sentido, _id: sentido };
}

function respuestaPaginada<T>(items: T[], total: number, pagina: number) {
  return { items, total, pagina, porPagina: POR_PAGINA };
}

rutasAdmin.get("/resumen", async (_req, res) => {
  const [usuarios, viajes, consultas, consultasPendientes] = await Promise.all([
    Usuario.countDocuments().exec(),
    Viaje.countDocuments().exec(),
    Consulta.countDocuments().exec(),
    Consulta.countDocuments({ atendida: { $ne: true } }).exec(),
  ]);
  res.json({ usuarios, viajes, consultas, consultasPendientes });
});

rutasAdmin.get("/consultas", async (req, res) => {
  const pagina = paginacion(req, res);
  if (pagina === null) return;
  const lista = busquedaYOrden(req, res);
  if (lista === null) return;
  const filtro = buscarEn(["email", "asunto"], lista.texto);
  const [consultas, total] = await Promise.all([
    Consulta.find(filtro)
      .select("email asunto descripcion atendida confirmacionEnviada avisoEnviado createdAt")
      .sort(ordenarPor(lista.orden, "email"))
      .collation(ORDEN_ESPANOL)
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean()
      .exec(),
    Consulta.countDocuments(filtro).exec(),
  ]);
  res.json(respuestaPaginada(consultas.map((consulta) => ({
    id: consulta._id.toString(),
    email: consulta.email,
    asunto: consulta.asunto,
    descripcion: consulta.descripcion,
    atendida: consulta.atendida ?? false,
    confirmacionEnviada: consulta.confirmacionEnviada ?? false,
    avisoEnviado: consulta.avisoEnviado ?? false,
    creadaEn: consulta.createdAt,
  })), total, pagina));
});

rutasAdmin.patch("/consultas/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const datos = z.object({ atendida: z.boolean() }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const consulta = await Consulta.findByIdAndUpdate(
    req.params.id,
    { $set: { atendida: datos.data.atendida } },
    { new: true, runValidators: true },
  ).select("_id atendida").lean().exec();
  if (!consulta) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json({ id: consulta._id.toString(), atendida: consulta.atendida ?? false });
});

rutasAdmin.post("/consultas/:id/responder", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const datos = z.object({ respuesta: z.string().trim().min(1).max(5000) }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "respuesta-invalida" });
    return;
  }
  const consulta = await Consulta.findById(req.params.id).select("_id email asunto descripcion").lean().exec();
  if (!consulta) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!correoConfigurado()) {
    res.status(503).json({ error: "correo-no-configurado" });
    return;
  }
  try {
    await mandarRespuestaConsulta(consulta, datos.data.respuesta);
  } catch (error) {
    console.error("No se pudo enviar la respuesta a la consulta", error);
    res.status(502).json({ error: "no-se-pudo-enviar" });
    return;
  }
  // Solo queda guardado lo que de verdad salió por mail.
  await RespuestaConsulta.create({
    consultaId: consulta._id,
    email: consulta.email,
    asunto: consulta.asunto,
    descripcion: consulta.descripcion,
    texto: datos.data.respuesta,
  });
  res.json({ ok: true });
});

rutasAdmin.get("/respuestas", async (req, res) => {
  const pagina = paginacion(req, res);
  if (pagina === null) return;
  const lista = busquedaYOrden(req, res);
  if (lista === null) return;
  const filtro = buscarEn(["email", "asunto", "texto"], lista.texto);
  const [respuestas, total] = await Promise.all([
    RespuestaConsulta.find(filtro)
      .sort(ordenarPor(lista.orden, "email"))
      .collation(ORDEN_ESPANOL)
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean()
      .exec(),
    RespuestaConsulta.countDocuments(filtro).exec(),
  ]);
  res.json(respuestaPaginada(respuestas.map((respuesta) => ({
    id: respuesta._id.toString(),
    texto: respuesta.texto,
    enviadaEn: respuesta.createdAt,
    consulta: {
      id: respuesta.consultaId.toString(),
      email: respuesta.email,
      asunto: respuesta.asunto,
      descripcion: respuesta.descripcion,
    },
  })), total, pagina));
});

rutasAdmin.delete("/consultas/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const resultado = await Consulta.deleteOne({ _id: req.params.id }).exec();
  if (resultado.deletedCount === 0) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.status(204).end();
});

rutasAdmin.get("/usuarios", async (req, res) => {
  const pagina = paginacion(req, res);
  if (pagina === null) return;
  const lista = busquedaYOrden(req, res);
  if (lista === null) return;
  const filtro: mongoose.QueryFilter<DatosUsuario> = buscarEn(["nombre", "email"], lista.texto);
  // Dos personas con el mismo nombre quedan ordenadas por mail.
  const ordenamiento = lista.orden === "alfabetico"
    ? { nombre: 1 as const, email: 1 as const, _id: 1 as const }
    : ordenarPor(lista.orden, "nombre");
  const [usuarios, total] = await Promise.all([
    Usuario.find(filtro)
    .select("email nombre pinz createdAt")
    .sort(ordenamiento)
    .collation(ORDEN_ESPANOL)
    .skip((pagina - 1) * USUARIOS_POR_PAGINA)
    .limit(USUARIOS_POR_PAGINA)
    .lean()
    .exec(),
    Usuario.countDocuments(filtro).exec(),
  ]);
  res.json({
    items: usuarios.map((usuario) => ({
    id: usuario._id.toString(),
    email: usuario.email,
    nombre: usuario.nombre,
    pinz: usuario.pinz ?? null,
    creadoEn: usuario.createdAt,
    })),
    total,
    pagina,
    porPagina: USUARIOS_POR_PAGINA,
  });
});

rutasAdmin.get("/viajes", async (req, res) => {
  const pagina = paginacion(req, res);
  if (pagina === null) return;
  const lista = busquedaYOrden(req, res);
  if (lista === null) return;
  const filtro = buscarEn(["nombre", "destino"], lista.texto);
  const [viajes, total] = await Promise.all([
    Viaje.find(filtro)
      .select("nombre destino fechaIda fechaVuelta creadoPor miembros createdAt")
      .sort(ordenarPor(lista.orden, "nombre"))
      .collation(ORDEN_ESPANOL)
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean()
      .exec(),
    Viaje.countDocuments(filtro).exec(),
  ]);
  const creadorIds = [...new Set(viajes.map((viaje) => viaje.creadoPor.toString()))];
  const creadores = await Usuario.find({ _id: { $in: creadorIds } }).select("email nombre").lean().exec();
  const porId = new Map(creadores.map((usuario) => [usuario._id.toString(), { email: usuario.email, nombre: usuario.nombre }]));
  res.json(respuestaPaginada(viajes.map((viaje) => ({
    id: viaje._id.toString(),
    nombre: viaje.nombre,
    destino: viaje.destino,
    fechaIda: viaje.fechaIda ?? null,
    fechaVuelta: viaje.fechaVuelta ?? null,
    creadoEn: viaje.createdAt,
    creador: porId.get(viaje.creadoPor.toString()) ?? null,
    personas: viaje.miembros.map((miembro) => ({ nombre: miembro.nombre, rol: miembro.rol })),
  })), total, pagina));
});
