import mongoose from "mongoose";
import { Viaje } from "../modelos/Viaje.js";
import { partesPorReglaVieja } from "./calculo.js";

type Crudo = Record<string, unknown>;

/**
 * Completa lo que les falta a los gastos y pagos ya guardados. Se puede correr más de una vez:
 * lo que ya está completo queda igual.
 */
export async function migrarCuentas() {
  const viajes = await Viaje.collection.find({}).toArray();
  for (const viaje of viajes) {
    const miembros = ((viaje.miembros ?? []) as Crudo[]).map((miembro) => String(miembro.usuarioId));
    const gastos = ((viaje.gastos ?? []) as Crudo[]).map((crudo) => {
      const { pagosConfirmados: _sinUso, ...gasto } = crudo;
      const partes = (gasto.partes ?? []) as unknown[];
      return {
        ...gasto,
        partes: partes.length > 0
          ? partes
          : partesPorReglaVieja(
              gasto.monto as number,
              gasto.division as "iguales" | "consumo",
              ((gasto.participantes ?? []) as unknown[]).map(String),
              miembros,
              String(gasto.pagoId),
            ).map((parte) => ({ personaId: new mongoose.Types.ObjectId(parte.personaId), monto: parte.monto })),
        propina: gasto.propina ?? 0,
        creadoPorId: gasto.creadoPorId ?? gasto.pagoId,
      };
    });
    const pagos = ((viaje.pagos ?? []) as Crudo[]).map((pago) => ({
      ...pago,
      id: pago.id ?? crypto.randomUUID(),
      estado: pago.estado ?? "confirmado",
      resueltoEn: pago.resueltoEn ?? null,
    }));
    await Viaje.collection.updateOne({ _id: viaje._id }, { $set: { gastos, pagos } });
  }
  return viajes.length;
}
