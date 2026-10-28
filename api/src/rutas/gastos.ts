import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Usuario } from "../modelos/Usuario.js";
import { puedeEditarViaje, registrarMovimiento, viajeDelMiembro } from "../viajePublico.js";

export const rutasGastos = Router({ mergeParams: true });

const GastoSchema = z.object({
  descripcion: z.string().trim().min(1).max(160),
  monto: z.number().int().positive(),
  division: z.enum(["iguales", "consumo"]),
  participantes: z.array(z.string().min(1)).default([]),
});

function calcularNetos(viaje: NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>) {
  const netos = new Map(viaje.miembros.map((miembro) => [miembro.usuarioId.toString(), 0]));
  for (const gasto of viaje.gastos) {
    const pagadorId = gasto.pagoId.toString();
    const miembros = gasto.division === "consumo" && gasto.participantes.length > 0
      ? viaje.miembros.filter((miembro) => gasto.participantes.some((id) => id.toString() === miembro.usuarioId.toString()))
      : viaje.miembros;
    if (miembros.length === 0) continue;
    netos.set(pagadorId, (netos.get(pagadorId) ?? 0) + gasto.monto);
    const parte = Math.floor(gasto.monto / miembros.length);
    let resto = gasto.monto - parte * miembros.length;
    for (const miembro of miembros) {
      const porcion = parte + (resto > 0 ? 1 : 0);
      if (resto > 0) resto -= 1;
      const usuarioId = miembro.usuarioId.toString();
      netos.set(usuarioId, (netos.get(usuarioId) ?? 0) - porcion);
    }
  }
  for (const pago of viaje.pagos) {
    const deudorId = pago.deudorId.toString();
    const acreedorId = pago.acreedorId.toString();
    netos.set(deudorId, (netos.get(deudorId) ?? 0) + pago.monto);
    netos.set(acreedorId, (netos.get(acreedorId) ?? 0) - pago.monto);
  }
  return netos;
}

rutasGastos.get("/", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.gastos.map((gasto) => ({
    id: gasto.id,
    viajeId: viaje._id.toString(),
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    pagoId: gasto.pagoId.toString(),
    fecha: gasto.fecha,
    division: gasto.division,
    participantes: gasto.participantes.map((id) => id.toString()),
  })));
});

rutasGastos.post("/", async (req, res) => {
  const datos = GastoSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  const usuario = await Usuario.findById(usuarioId);
  if (!viaje || !usuario) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (datos.data.participantes.some((id) => !viaje.miembros.some((miembro) => miembro.usuarioId.toString() === id))) {
    res.status(400).json({ error: "participante-no-es-miembro" });
    return;
  }
  if (datos.data.division === "consumo" && datos.data.participantes.length === 0) {
    res.status(400).json({ error: "selecciona-participantes" });
    return;
  }
  const gasto = {
    id: crypto.randomUUID(),
    ...datos.data,
    pagoId: usuario._id,
    fecha: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()),
    participantes: datos.data.participantes.map((id) => new mongoose.Types.ObjectId(id)),
    pagosConfirmados: [],
  };
  viaje.gastos.push(gasto);
  registrarMovimiento(viaje, `${usuario.nombre} cargó “${gasto.descripcion}”`);
  await viaje.save();
  res.status(201).json({
    id: gasto.id,
    viajeId: viaje._id.toString(),
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    pagoId: usuario.id,
    fecha: gasto.fecha,
    division: gasto.division,
    participantes: gasto.participantes.map((id) => id.toString()),
  });
});

rutasGastos.get("/saldos", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const netos = calcularNetos(viaje);
  const usuarioActual = await Usuario.findById(res.locals.usuarioId).select("moneda").exec();
  res.json({
    viajeId: viaje._id.toString(),
    moneda: usuarioActual?.moneda ?? "ARS",
    saldos: viaje.miembros
      .filter((miembro) => miembro.usuarioId.toString() !== (res.locals.usuarioId as string))
      .map((miembro) => ({
        persona: { id: miembro.usuarioId.toString(), nombre: miembro.nombre, pinz: miembro.pinz ?? null },
        monto: netos.get(miembro.usuarioId.toString()) ?? 0,
      })),
  });
});

rutasGastos.post("/pagos", async (req, res) => {
  const datos = z.object({ personaId: z.string().min(1) }).safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  if (!mongoose.isValidObjectId(datos.data.personaId)) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  const deudor = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === datos.data.personaId);
  const acreedor = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  if (!viaje || !deudor || !acreedor) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeEditarViaje(viaje, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const netos = calcularNetos(viaje);
  const monto = Math.min(
    Math.max(0, -(netos.get(deudor.usuarioId.toString()) ?? 0)),
    Math.max(0, netos.get(acreedor.usuarioId.toString()) ?? 0),
  );
  if (monto === 0) {
    res.status(409).json({ error: "sin-deuda-pendiente" });
    return;
  }
  viaje.pagos.push({
    deudorId: deudor.usuarioId,
    acreedorId: acreedor.usuarioId,
    monto,
    fecha: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()),
  });
  registrarMovimiento(viaje, `${deudor.nombre} registró un pago a ${acreedor.nombre}`);
  await viaje.save();
  res.status(204).end();
});

rutasGastos.post("/simplificar", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const netos = calcularNetos(viaje);
  const personas = viaje.miembros.map((miembro) => ({
    id: miembro.usuarioId.toString(),
    nombre: miembro.nombre,
    saldo: netos.get(miembro.usuarioId.toString()) ?? 0,
  }));
  const deudores = personas.filter((persona) => persona.saldo < 0).sort((a, b) => a.saldo - b.saldo);
  const acreedores = personas.filter((persona) => persona.saldo > 0).sort((a, b) => b.saldo - a.saldo);
  const transferencias: { de: string; a: string; monto: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];
    if (!deudor || !acreedor) break;
    const monto = Math.min(-deudor.saldo, acreedor.saldo);
    if (monto > 0) transferencias.push({ de: deudor.id, a: acreedor.id, monto });
    deudor.saldo += monto;
    acreedor.saldo -= monto;
    if (deudor.saldo === 0) i += 1;
    if (acreedor.saldo === 0) j += 1;
  }
  res.json({ viajeId: viaje._id.toString(), transferencias });
});
