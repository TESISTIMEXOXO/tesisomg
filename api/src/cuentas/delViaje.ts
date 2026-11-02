import type { DocViaje } from "../modelos/Viaje.js";
import { calcularNetos, partesPorReglaVieja } from "./calculo.js";

type Gasto = DocViaje["gastos"][number];

/** Las partes de un gasto. Los guardados antes de la migración se calculan con la regla vieja. */
export function partesDe(viaje: DocViaje, gasto: Gasto) {
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

export function gastosDe(viaje: DocViaje) {
  return viaje.gastos.map((gasto) => ({ pagoId: gasto.pagoId.toString(), partes: partesDe(viaje, gasto) }));
}

export function pagosDe(viaje: DocViaje) {
  return viaje.pagos.map((pago) => ({
    deudorId: pago.deudorId.toString(),
    acreedorId: pago.acreedorId.toString(),
    monto: pago.monto,
    estado: pago.estado,
  }));
}

export function netosDe(viaje: DocViaje) {
  return calcularNetos(gastosDe(viaje), pagosDe(viaje));
}
