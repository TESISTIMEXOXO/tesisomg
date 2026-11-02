import { Router, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { conListasAlDia, listasDe } from "../listasDelViaje.js";
import { COLORES_LISTA, type DocViaje } from "../modelos/Viaje.js";
import { esOrganizador, puedeEditarViaje, viajeDelMiembro } from "../viajePublico.js";

export const rutasListas = Router({ mergeParams: true });

type Lista = DocViaje["listas"][number];

const TituloItem = z.string().trim().min(1).max(120);

const NuevaListaSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  color: z.enum(COLORES_LISTA),
  grupal: z.boolean(),
  /** Las personas de una lista grupal. Quien la crea entra siempre. */
  participantes: z.array(z.string()).max(100),
  items: z.array(TituloItem).max(100),
});

function listaPublica(viaje: DocViaje, lista: Lista) {
  const miembros = new Set(viaje.miembros.map((miembro) => miembro.usuarioId.toString()));
  return {
    id: lista.id,
    viajeId: viaje._id.toString(),
    nombre: lista.nombre,
    color: lista.color,
    grupal: lista.grupal,
    creadaPorId: lista.creadaPor.toString(),
    participantes: lista.participantes.map((id) => id.toString()).filter((id) => miembros.has(id)),
    items: lista.items.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      hecha: item.hecha,
      responsableId: item.responsableId?.toString() ?? null,
    })),
  };
}

/** El viaje listo para escribir: corta con 404 o 403 si esa persona no puede. */
async function viajeParaEditar(viajeId: string, res: Response) {
  const usuarioId = res.locals.usuarioId as string;
  const encontrado = await viajeDelMiembro(viajeId, usuarioId);
  if (!encontrado) {
    res.status(404).json({ error: "no-existe" });
    return null;
  }
  if (!puedeEditarViaje(encontrado, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return null;
  }
  return conListasAlDia(encontrado);
}

function listaVisible(viaje: DocViaje, listaId: string, res: Response) {
  const lista = listasDe(viaje, res.locals.usuarioId as string).find((item) => item.id === listaId);
  if (!lista) res.status(404).json({ error: "no-existe" });
  return lista ?? null;
}

rutasListas.get("/", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const encontrado = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!encontrado) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const viaje = await conListasAlDia(encontrado);
  res.json(listasDe(viaje, usuarioId).map((lista) => listaPublica(viaje, lista)));
});

rutasListas.post("/", async (req, res) => {
  const datos = NuevaListaSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const viaje = await viajeParaEditar((req.params as { id: string }).id, res);
  if (!viaje) return;
  const usuarioId = res.locals.usuarioId as string;
  const { nombre, color, grupal, items } = datos.data;
  const participantes = grupal ? [...new Set([usuarioId, ...datos.data.participantes])] : [usuarioId];
  const miembros = new Set(viaje.miembros.map((miembro) => miembro.usuarioId.toString()));
  if (participantes.some((id) => !miembros.has(id))) {
    res.status(400).json({ error: "participante-no-es-miembro" });
    return;
  }
  viaje.listas.push({
    id: crypto.randomUUID(),
    nombre,
    color,
    grupal,
    creadaPor: new mongoose.Types.ObjectId(usuarioId),
    participantes: participantes.map((id) => new mongoose.Types.ObjectId(id)),
    items: items.map((titulo) => ({ id: crypto.randomUUID(), titulo, hecha: false, responsableId: null })),
  });
  await viaje.save();
  res.status(201).json(listaPublica(viaje, viaje.listas.at(-1) as Lista));
});

/** Cualquier participante la edita. Volverla personal, que deja afuera a los demás, solo lo hace quien la creó. */
rutasListas.patch("/:listaId", async (req, res) => {
  const datos = NuevaListaSchema.omit({ items: true }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const parametros = req.params as { id: string; listaId: string };
  const viaje = await viajeParaEditar(parametros.id, res);
  if (!viaje) return;
  const lista = listaVisible(viaje, parametros.listaId, res);
  if (!lista) return;
  const usuarioId = res.locals.usuarioId as string;
  const creadora = lista.creadaPor.toString();
  const { nombre, color, grupal } = datos.data;
  if (!grupal && creadora !== usuarioId) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const miembros = new Set(viaje.miembros.map((miembro) => miembro.usuarioId.toString()));
  const participantes = grupal ? [...new Set([...(miembros.has(creadora) ? [creadora] : []), ...datos.data.participantes])] : [usuarioId];
  if (participantes.length === 0 || participantes.some((id) => !miembros.has(id))) {
    res.status(400).json({ error: "participante-no-es-miembro" });
    return;
  }
  lista.nombre = nombre;
  lista.color = color;
  lista.grupal = grupal;
  lista.participantes = participantes.map((id) => new mongoose.Types.ObjectId(id));
  await viaje.save();
  res.json(listaPublica(viaje, lista));
});

rutasListas.delete("/:listaId", async (req, res) => {
  const parametros = req.params as { id: string; listaId: string };
  const viaje = await viajeParaEditar(parametros.id, res);
  if (!viaje) return;
  const lista = listaVisible(viaje, parametros.listaId, res);
  if (!lista) return;
  const usuarioId = res.locals.usuarioId as string;
  if (lista.creadaPor.toString() !== usuarioId && !esOrganizador(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  viaje.listas = viaje.listas.filter((item) => item.id !== lista.id);
  await viaje.save();
  res.status(204).end();
});

rutasListas.post("/:listaId/items", async (req, res) => {
  const titulo = TituloItem.safeParse(req.body?.titulo);
  if (!titulo.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const parametros = req.params as { id: string; listaId: string };
  const viaje = await viajeParaEditar(parametros.id, res);
  if (!viaje) return;
  const lista = listaVisible(viaje, parametros.listaId, res);
  if (!lista) return;
  lista.items.push({ id: crypto.randomUUID(), titulo: titulo.data, hecha: false, responsableId: null });
  await viaje.save();
  res.status(201).json(listaPublica(viaje, lista));
});

rutasListas.patch("/:listaId/items/:itemId", async (req, res) => {
  const datos = z.object({ hecha: z.boolean() }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const parametros = req.params as { id: string; listaId: string; itemId: string };
  const viaje = await viajeParaEditar(parametros.id, res);
  if (!viaje) return;
  const lista = listaVisible(viaje, parametros.listaId, res);
  if (!lista) return;
  const item = lista.items.find((actual) => actual.id === parametros.itemId);
  if (!item) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  item.hecha = datos.data.hecha;
  await viaje.save();
  res.status(204).end();
});

rutasListas.delete("/:listaId/items/:itemId", async (req, res) => {
  const parametros = req.params as { id: string; listaId: string; itemId: string };
  const viaje = await viajeParaEditar(parametros.id, res);
  if (!viaje) return;
  const lista = listaVisible(viaje, parametros.listaId, res);
  if (!lista) return;
  lista.items = lista.items.filter((item) => item.id !== parametros.itemId);
  await viaje.save();
  res.status(204).end();
});
