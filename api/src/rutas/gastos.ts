import { Router, type Request, type Response } from "express";
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
    estado: pago.estado,
  }));
}

function transferenciasDe(viaje: ViajeConGastos) {
  return transferenciasDirectas(gastosDe(viaje), pagosDe(viaje));
}

function hoy() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

function pagoPublico(pago: ViajeConGastos["pagos"][number]) {
  return {
    id: pago.id,
    deudorId: pago.deudorId.toString(),
    acreedorId: pago.acreedorId.toString(),
    monto: pago.monto,
    fecha: pago.fecha,
    estado: pago.estado,
  };
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
  const conVos = saldosPara(usuarioId, transferenciasDe(viaje));
  const usuarioActual = await Usuario.findById(usuarioId).select("moneda").exec();
  res.json({
    viajeId: viaje._id.toString(),
    moneda: usuarioActual?.moneda ?? "ARS",
    saldos: viaje.miembros
      .filter((miembro) => miembro.usuarioId.toString() !== usuarioId)
      .map((miembro) => {
        const personaId = miembro.usuarioId.toString();
        const enviado = viaje.pagos.find((pago) =>
          pago.estado === "pendiente" && pago.deudorId.toString() === usuarioId && pago.acreedorId.toString() === personaId);
        return {
          persona: { id: personaId, nombre: miembro.nombre, pinz: miembro.pinz ?? null },
          monto: conVos.get(personaId) ?? 0,
          pagoEnviado: enviado ? { id: enviado.id, monto: enviado.monto } : null,
        };
      }),
  });
});

rutasGastos.get("/pagos", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(viaje.pagos.map(pagoPublico).reverse());
});

/** Quien registra es quien paga: el pago queda pendiente hasta que lo confirme quien lo recibe. */
rutasGastos.post("/pagos", async (req, res) => {
  const datos = z.object({ personaId: z.string().min(1) }).safeParse(req.body);
  if (!datos.success || !mongoose.isValidObjectId(datos.data.personaId)) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  const acreedor = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === datos.data.personaId);
  const deudor = viaje?.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId);
  if (!viaje || !deudor || !acreedor) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const yaPendiente = viaje.pagos.some((pago) =>
    pago.estado === "pendiente"
    && pago.deudorId.toString() === usuarioId
    && pago.acreedorId.toString() === datos.data.personaId);
  if (yaPendiente) {
    res.status(409).json({ error: "pago-ya-pendiente" });
    return;
  }
  const monto = -(saldosPara(usuarioId, transferenciasDe(viaje)).get(datos.data.personaId) ?? 0);
  if (monto <= 0) {
    res.status(409).json({ error: "sin-deuda-pendiente" });
    return;
  }
  viaje.pagos.push({
    id: crypto.randomUUID(),
    deudorId: deudor.usuarioId,
    acreedorId: acreedor.usuarioId,
    monto,
    fecha: hoy(),
    estado: "pendiente",
    resueltoEn: null,
  });
  registrarMovimiento(viaje, `${deudor.nombre} registró un pago a ${acreedor.nombre}`);
  await viaje.save();
  const pago = viaje.pagos[viaje.pagos.length - 1];
  res.status(201).json(pago && pagoPublico(pago));
});

async function resolverPago(req: Request, res: Response, estado: "confirmado" | "rechazado") {
  const { id, pagoId } = req.params as { id: string; pagoId: string };
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(id, usuarioId);
  const pago = viaje?.pagos.find((candidato) => candidato.id === pagoId);
  if (!viaje || !pago) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (pago.acreedorId.toString() !== usuarioId) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  if (pago.estado !== "pendiente") {
    res.status(409).json({ error: "pago-ya-resuelto" });
    return;
  }
  pago.estado = estado;
  pago.resueltoEn = new Date();
  const nombre = (personaId: mongoose.Types.ObjectId) =>
    viaje.miembros.find((miembro) => miembro.usuarioId.equals(personaId))?.nombre ?? "Alguien";
  registrarMovimiento(
    viaje,
    estado === "confirmado"
      ? `${nombre(pago.acreedorId)} confirmó el pago de ${nombre(pago.deudorId)}`
      : `${nombre(pago.acreedorId)} rechazó el pago de ${nombre(pago.deudorId)}`,
  );
  await viaje.save();
  res.json(pagoPublico(pago));
}

rutasGastos.post("/pagos/:pagoId/confirmar", (req, res) => resolverPago(req, res, "confirmado"));
rutasGastos.post("/pagos/:pagoId/rechazar", (req, res) => resolverPago(req, res, "rechazado"));

rutasGastos.post("/simplificar", async (req, res) => {
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, res.locals.usuarioId as string);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  const transferencias = transferenciasSimplificadas(calcularNetos(gastosDe(viaje), pagosDe(viaje)));
  res.json({ viajeId: viaje._id.toString(), transferencias });
});
