import { Router, type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requiereSesion } from "../auth/sesion.js";
import { correoConfigurado, mandarRespuestaConsulta } from "../auth/mail.js";
import { config } from "../config.js";
import { Consulta } from "../modelos/Consulta.js";
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
const ordenUsuarioSchema = z.enum(["nuevo", "antiguo", "alfabetico"]).default("nuevo");
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
  const [consultas, total] = await Promise.all([
    Consulta.find()
      .select("email asunto descripcion atendida confirmacionEnviada avisoEnviado createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean()
      .exec(),
    Consulta.countDocuments().exec(),
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
  const consulta = await Consulta.findById(req.params.id).select("email asunto descripcion").lean().exec();
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
  res.json({ ok: true });
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
  const busqueda = busquedaSchema.safeParse(req.query.q);
  if (!busqueda.success) {
    res.status(400).json({ error: "busqueda-invalida" });
    return;
  }
  const orden = ordenUsuarioSchema.safeParse(req.query.orden);
  if (!orden.success) {
    res.status(400).json({ error: "orden-invalido" });
    return;
  }
  const filtros: mongoose.QueryFilter<DatosUsuario>[] = [];
  if (busqueda.data) {
    const textoSeguro = busqueda.data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filtros.push({ $or: [{ nombre: { $regex: textoSeguro, $options: "i" } }, { email: { $regex: textoSeguro, $options: "i" } }] });
  }
  const filtro = filtros[0] ?? {};
  const ordenamiento = orden.data === "alfabetico"
    ? { nombre: 1 as const, email: 1 as const, _id: 1 as const }
    : { createdAt: orden.data === "nuevo" ? -1 as const : 1 as const, _id: orden.data === "nuevo" ? -1 as const : 1 as const };
  const [usuarios, total] = await Promise.all([
    Usuario.find(filtro)
    .select("email nombre pinz createdAt")
    .sort(ordenamiento)
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
  const [viajes, total] = await Promise.all([
    Viaje.find()
      .select("nombre destino fechaIda fechaVuelta creadoPor miembros createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean()
      .exec(),
    Viaje.countDocuments().exec(),
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
