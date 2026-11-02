import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  calcularNetos,
  dividirIguales,
  dividirPorConsumo,
  partesPorReglaVieja,
  saldosPara,
  transferenciasDirectas,
  transferenciasSimplificadas,
  type Parte,
} from "../cuentas/calculo.js";
import { Usuario } from "../modelos/Usuario.js";
import { esOrganizador, puedeEditarViaje, registrarMovimiento, viajeDelMiembro } from "../viajePublico.js";

export const rutasGastos = Router({ mergeParams: true });

const MONTO_MAXIMO = 100_000_000;

const sinRepetidos = (lista: string[]) => new Set(lista).size === lista.length;

const CamposGasto = {
  descripcion: z.string().trim().min(1).max(160),
  monto: z.number().int().min(1).max(MONTO_MAXIMO),
  pagoId: z.string().min(1).optional(),
  fecha: z.iso.date().optional(),
  participantes: z.array(z.string().min(1)).refine(sinRepetidos).optional(),
};

const GastoSchema = z.discriminatedUnion("division", [
  z.object({ ...CamposGasto, division: z.literal("iguales") }),
  z.object({
    ...CamposGasto,
    division: z.literal("consumo"),
    consumos: z
      .array(z.object({ personaId: z.string().min(1), monto: z.number().int().min(1) }))
      .min(1)
      .refine((consumos) => sinRepetidos(consumos.map((consumo) => consumo.personaId))),
    propina: z.number().int().min(0).max(100).default(0),
  }),
]);

type ViajeConGastos = NonNullable<Awaited<ReturnType<typeof viajeDelMiembro>>>;

type Gasto = ViajeConGastos["gastos"][number];

/** Las partes de un gasto. Los guardados antes de la migración se calculan con la regla vieja. */
function partesDe(viaje: ViajeConGastos, gasto: Gasto) {
  if (gasto.partes.length > 0) {
    return gasto.partes.map((parte) => ({ personaId: parte.personaId.toString(), monto: parte.monto }));
  }
  return partesPorReglaVieja(
    gasto.monto,
    gasto.division,
    gasto.participantes.map((id) => id.toString()),
    viaje.miembros.map((miembro) => miembro.usuarioId.toString()),
    gasto.pagoId.toString(),
  );
}

function gastosDe(viaje: ViajeConGastos) {
  return viaje.gastos.map((gasto) => ({ pagoId: gasto.pagoId.toString(), partes: partesDe(viaje, gasto) }));
}

function gastoPublico(viaje: ViajeConGastos, gasto: Gasto) {
  return {
    id: gasto.id,
    viajeId: viaje._id.toString(),
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    pagoId: gasto.pagoId.toString(),
    fecha: gasto.fecha,
    division: gasto.division,
    participantes: gasto.participantes.map((id) => id.toString()),
    partes: partesDe(viaje, gasto),
    consumos: gasto.consumos.map((consumo) => ({ personaId: consumo.personaId.toString(), monto: consumo.monto })),
    propina: gasto.propina,
    propinaPorcentaje: gasto.propinaPorcentaje,
    creadoPorId: (gasto.creadoPorId ?? gasto.pagoId).toString(),
  };
}

const aObjectId = (id: string) => new mongoose.Types.ObjectId(id);
const aParte = (parte: Parte) => ({ personaId: aObjectId(parte.personaId), monto: parte.monto });

type ArmadoDeGasto = { error: string } | { campos: Omit<Gasto, "id" | "creadoPorId"> };

/** Valida contra el viaje y calcula las partes. Al editar, lo que no llega queda como estaba. */
function armarGasto(viaje: ViajeConGastos, usuarioId: string, datos: z.infer<typeof GastoSchema>, previo?: Gasto): ArmadoDeGasto {
  const miembros = viaje.miembros.map((miembro) => miembro.usuarioId.toString());
  const consumos = datos.division === "consumo" ? datos.consumos : [];
  const consumieron = consumos.map((consumo) => consumo.personaId);
  const pagoId = datos.pagoId ?? previo?.pagoId.toString() ?? usuarioId;
  const participantes = datos.participantes ?? (datos.division === "consumo" ? consumieron : miembros);

  if (participantes.length === 0) return { error: "selecciona-participantes" };
  if ([pagoId, ...participantes, ...consumieron].some((id) => !miembros.includes(id))) {
    return { error: "participante-no-es-miembro" };
  }
  const comunes = {
    descripcion: datos.descripcion,
    pagoId: aObjectId(pagoId),
    fecha: datos.fecha ?? previo?.fecha ?? hoy(),
    division: datos.division,
    participantes: participantes.map(aObjectId),
  };

  if (datos.division === "iguales") {
    if (datos.monto < participantes.length) return { error: "datos-invalidos" };
    return {
      campos: {
        ...comunes,
        monto: datos.monto,
        partes: dividirIguales(datos.monto, participantes, pagoId).map(aParte),
        consumos: [],
        propina: 0,
        propinaPorcentaje: 0,
      },
    };
  }

  if (consumieron.length !== participantes.length || consumieron.some((id) => !participantes.includes(id))) {
    return { error: "datos-invalidos" };
  }
  if (consumos.reduce((total, consumo) => total + consumo.monto, 0) !== datos.monto) {
    return { error: "consumos-no-suman" };
  }
  const { partes, propina, monto } = dividirPorConsumo(consumos, datos.propina);
  if (monto > MONTO_MAXIMO) return { error: "datos-invalidos" };
  return {
    campos: {
      ...comunes,
      monto,
      partes: partes.map(aParte),
      consumos: consumos.map(aParte),
      propina,
      propinaPorcentaje: datos.propina,
    },
  };
}

/** Quien lo cargó o quien organiza, si no es lector. */
function puedeCambiarGasto(viaje: ViajeConGastos, gasto: Gasto, usuarioId: string) {
  if (!puedeEditarViaje(viaje, usuarioId)) return false;
  return (gasto.creadoPorId ?? gasto.pagoId).toString() === usuarioId || esOrganizador(viaje, usuarioId);
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
  const gastos = gastosDe(viaje);
  const pagos = pagosDe(viaje);
  return viaje.cuentasSimplificadas
    ? transferenciasSimplificadas(calcularNetos(gastos, pagos))
    : transferenciasDirectas(gastos, pagos);
}

/** Cómo está cada persona del viaje con quien pregunta. */
function saldosPublicos(viaje: ViajeConGastos, usuarioId: string) {
  const conVos = saldosPara(usuarioId, transferenciasDe(viaje));
  return {
    viajeId: viaje._id.toString(),
    moneda: viaje.moneda,
    simplificadas: viaje.cuentasSimplificadas,
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
  };
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
  const nuevosPrimero = viaje.gastos
    .map((gasto) => gastoPublico(viaje, gasto))
    .reverse()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  res.json(nuevosPrimero);
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
  const armado = armarGasto(viaje, usuarioId, datos.data);
  if ("error" in armado) {
    res.status(400).json({ error: armado.error });
    return;
  }
  viaje.gastos.push({ id: crypto.randomUUID(), ...armado.campos, creadoPorId: usuario._id });
  registrarMovimiento(viaje, `${usuario.nombre} cargó “${armado.campos.descripcion}”`);
  await viaje.save();
  const gasto = viaje.gastos[viaje.gastos.length - 1];
  res.status(201).json(gasto && gastoPublico(viaje, gasto));
});

rutasGastos.patch("/:gastoId", async (req, res) => {
  const datos = GastoSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({ error: "datos-invalidos", detalle: z.flattenError(datos.error) });
    return;
  }
  const { id, gastoId } = req.params as { id: string; gastoId: string };
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(id, usuarioId);
  const gasto = viaje?.gastos.find((candidato) => candidato.id === gastoId);
  if (!viaje || !gasto) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeCambiarGasto(viaje, gasto, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const armado = armarGasto(viaje, usuarioId, datos.data, gasto);
  if ("error" in armado) {
    res.status(400).json({ error: armado.error });
    return;
  }
  Object.assign(gasto, armado.campos);
  const nombre = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId)?.nombre ?? "Alguien";
  registrarMovimiento(viaje, `${nombre} editó “${gasto.descripcion}”`);
  await viaje.save();
  res.json(gastoPublico(viaje, gasto));
});

rutasGastos.delete("/:gastoId", async (req, res) => {
  const { id, gastoId } = req.params as { id: string; gastoId: string };
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro(id, usuarioId);
  const gasto = viaje?.gastos.find((candidato) => candidato.id === gastoId);
  if (!viaje || !gasto) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  if (!puedeCambiarGasto(viaje, gasto, usuarioId)) {
    res.status(403).json({ error: "sin-permiso" });
    return;
  }
  const nombre = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId)?.nombre ?? "Alguien";
  viaje.gastos = viaje.gastos.filter((candidato) => candidato.id !== gastoId);
  registrarMovimiento(viaje, `${nombre} borró “${gasto.descripcion}”`);
  await viaje.save();
  res.status(204).end();
});

rutasGastos.get("/saldos", async (req, res) => {
  const usuarioId = res.locals.usuarioId as string;
  const viaje = await viajeDelMiembro((req.params as { id: string }).id, usuarioId);
  if (!viaje) {
    res.status(404).json({ error: "no-existe" });
    return;
  }
  res.json(saldosPublicos(viaje, usuarioId));
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
  if (!viaje.cuentasSimplificadas) {
    viaje.cuentasSimplificadas = true;
    const nombre = viaje.miembros.find((miembro) => miembro.usuarioId.toString() === usuarioId)?.nombre ?? "Alguien";
    registrarMovimiento(viaje, `${nombre} simplificó las cuentas`);
    await viaje.save();
  }
  res.json(saldosPublicos(viaje, usuarioId));
});
