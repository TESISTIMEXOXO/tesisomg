import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { calcularNetos, dividirIguales, saldosPara, transferenciasDirectas, transferenciasSimplificadas } from "../cuentas/calculo.js";
import { Usuario } from "../modelos/Usuario.js";
import { puedeEditarViaje, registrarMovimiento, viajeDelMiembro } from "../viajePublico.js";

export const rutasGastos = Router({ mergeParams: true });

const GastoSchema = z.object({
  descripcion: z.string().trim().min(1).max(160),
  monto: z.number().int().positive(),
  division: z.enum(["iguales", "consumo"]),
  participantes: z.array(z.string().min(1)).default([]),
});

type ViajeConGastos = NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>;

/** Los gastos guardados todavía no tienen partes: se calculan con la regla de hoy. */
function gastosDe(viaje: ViajeConGastos) {
  const miembros = viaje.miembros.map((miembro) => miembro.usuarioId.toString());
  return viaje.gastos.map((gasto) => {
    const participantes = gasto.participantes.map((id) => id.toString());
    const entre = gasto.division === "consumo" && participantes.length > 0
      ? miembros.filter((id) => participantes.includes(id))
      : miembros;
    const pagoId = gasto.pagoId.toString();
    return { pagoId, partes: dividirIguales(gasto.monto, entre, pagoId) };
  });
}

function pagosDe(viaje: ViajeConGastos) {
  return viaje.pagos.map((pago) => ({
    deudorId: pago.deudorId.toString(),
    acreedorId: pago.acreedorId.toString(),
    monto: pago.monto,
    estado: "confirmado" as const,
  }));
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
  const usuarioId = res.locals.usuarioId as string;
  const conVos = saldosPara(usuarioId, transferenciasDirectas(gastosDe(viaje), pagosDe(viaje)));
  const usuarioActual = await Usuario.findById(usuarioId).select("moneda").exec();
  res.json({
    viajeId: viaje._id.toString(),
    moneda: usuarioActual?.moneda ?? "ARS",
    saldos: viaje.miembros
      .filter((miembro) => miembro.usuarioId.toString() !== usuarioId)
      .map((miembro) => ({
        persona: { id: miembro.usuarioId.toString(), nombre: miembro.nombre, pinz: miembro.pinz ?? null },
        monto: conVos.get(miembro.usuarioId.toString()) ?? 0,
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
  const netos = calcularNetos(gastosDe(viaje), pagosDe(viaje));
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
  const transferencias = transferenciasSimplificadas(calcularNetos(gastosDe(viaje), pagosDe(viaje)));
  res.json({ viajeId: viaje._id.toString(), transferencias });
});
