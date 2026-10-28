import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { z } from "zod";
import { Documento } from "../modelos/Documento.js";
import { puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasDocumentosPersonales = Router();
export const rutasDocumentosViaje = Router({ mergeParams: true });
export const rutasArchivo = Router();

const subirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const permitidos = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    callback(null, permitidos.has(file.mimetype));
  },
});

const Tipos = ["pasaje", "voucher", "seguro", "identidad", "otro"] as const;

function documentoPublico(documento: { id: string; viajeId?: mongoose.Types.ObjectId | null; nombre: string; tipo: string; tamano: number; vence?: string | null }) {
  return {
    id: documento.id,
    viajeId: documento.viajeId?.toString() ?? null,
    nombre: documento.nombre,
    tipo: documento.tipo,
    tamano: documento.tamano,
    personal: !documento.viajeId,
    vence: documento.vence ?? null,
  };
}

function detallesArchivo(nombre: string, contentType: string) {
  const extension = nombre.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || contentType === "application/pdf") return "voucher";
  if (["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) return "identidad";
  return "otro";
}

async function guardar(req: import("express").Request, res: import("express").Response, viajeId: mongoose.Types.ObjectId | null) {
  const archivo = req.file;
  if (!archivo) {
    res.status(400).json({ error: "falta-archivo" });
    return;
  }
  const vencimiento = z.string().nullable().optional().safeParse(req.body.vence ?? null);
  if (!vencimiento.success || (vencimiento.data && !/^\d{4}-\d{2}-\d{2}$/.test(vencimiento.data))) {
    res.status(400).json({ error: "fecha-invalida" });
    return;
  }
  const tipo = Tipos.includes(req.body.tipo) ? req.body.tipo : detallesArchivo(archivo.originalname, archivo.mimetype);
  const documento = await Documento.create({
    viajeId,
    propietarioId: new mongoose.Types.ObjectId(res.locals.usuarioId as string),
    nombre: archivo.originalname,
    tipo,
    tamano: archivo.size,
    contentType: archivo.mimetype,
    contenido: archivo.buffer,
    vence: vencimiento.data ?? null,
  });
  res.status(201).json(documentoPublico({ ...documento.toObject(), id: documento._id.toString() }));
}

rutasDocumentosPersonales.get("/", async (_req, res) => {
  const documentos = await Documento.find({ propietarioId: res.locals.usuarioId, viajeId: null }).sort({ createdAt: -1 }).exec();
  res.json(documentos.map((documento) => documentoPublico({ ...documento.toObject(), id: documento._id.toString() })));
});
rutasDocumentosPersonales.post("/", subirArchivo.single("archivo"), async (req, res) => guardar(req, res, null));

rutasDocumentosViaje.get("/", async (req, res) => {
  const viajeId = (req.params as { id: string }).id;
  const viaje = await viajeDelMiembro(viajeId, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const documentos = await Documento.find({ viajeId: viaje._id }).sort({ createdAt: -1 }).exec();
  res.json(documentos.map((documento) => documentoPublico({ ...documento.toObject(), id: documento._id.toString() })));
});
rutasDocumentosViaje.post("/", subirArchivo.single("archivo"), async (req, res) => {
  const viajeId = (req.params as { id: string }).id;
  const viaje = await viajeDelMiembro(viajeId, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, res.locals.usuarioId as string)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  await guardar(req, res, viaje._id);
});

rutasArchivo.get("/:id", async (req, res) => {
  const documentoId = (req.params as { id: string }).id;
  if (!mongoose.isValidObjectId(documentoId)) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const documento = await Documento.findById(documentoId).exec();
  const usuarioId = res.locals.usuarioId as string;
  if (!documento) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const autorizado = documento.viajeId
    ? Boolean(await viajeDelMiembro(documento.viajeId.toString(), usuarioId))
    : documento.propietarioId.toString() === usuarioId;
  if (!autorizado) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.setHeader("Content-Type", documento.contentType);
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(documento.nombre)}`);
  res.send(documento.contenido);
});
