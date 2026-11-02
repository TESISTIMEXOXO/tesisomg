/**
 * Las cuentas de un viaje, en funciones puras: sin base de datos, para poder probarlas solas.
 * Toda la plata son pesos enteros. Las reglas están en docs/cuentas.md.
 */

export type Parte = { personaId: string; monto: number };
export type GastoCalculo = { pagoId: string; partes: Parte[] };
export type PagoCalculo = { deudorId: string; acreedorId: string; monto: number; estado: "pendiente" | "confirmado" | "rechazado" };
export type Transferencia = { de: string; a: string; monto: number };

function porId(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Parte en iguales. Los pesos que sobran van de a uno: primero a quien pagó, después por id. */
export function dividirIguales(monto: number, participantes: string[], pagoId: string): Parte[] {
  if (participantes.length === 0) return [];
  const orden = [...participantes].sort((a, b) => {
    if (a === pagoId) return -1;
    if (b === pagoId) return 1;
    return porId(a, b);
  });
  const parte = Math.floor(monto / orden.length);
  const sobran = monto - parte * orden.length;
  return orden.map((personaId, indice) => ({ personaId, monto: parte + (indice < sobran ? 1 : 0) }));
}

/**
 * Parte por consumo: la propina se reparte en proporción a lo que consumió cada uno.
 * Los pesos que sobran van a las fracciones más grandes y los empates se definen por id.
 */
export function dividirPorConsumo(consumos: Parte[], porcentajePropina: number) {
  const subtotal = consumos.reduce((total, consumo) => total + consumo.monto, 0);
  const propina = Math.round((subtotal * porcentajePropina) / 100);
  if (subtotal === 0) return { partes: consumos, propina: 0, monto: 0 };

  // BigInt: propina × consumo puede pasar el máximo entero exacto de un number.
  const base = BigInt(subtotal);
  const repartos = consumos.map((consumo) => {
    const exacto = BigInt(propina) * BigInt(consumo.monto);
    return { personaId: consumo.personaId, enteros: Number(exacto / base), fraccion: Number(exacto % base) };
  });
  const sobran = propina - repartos.reduce((total, reparto) => total + reparto.enteros, 0);
  const conExtra = new Set(
    [...repartos]
      .sort((a, b) => b.fraccion - a.fraccion || porId(a.personaId, b.personaId))
      .slice(0, sobran)
      .map((reparto) => reparto.personaId),
  );
  const partes = consumos.map((consumo, indice) => ({
    personaId: consumo.personaId,
    monto: consumo.monto + (repartos[indice]?.enteros ?? 0) + (conExtra.has(consumo.personaId) ? 1 : 0),
  }));
  return { partes, propina, monto: subtotal + propina };
}

/** Lo que pagó − sus partes + pagos que mandó − pagos que recibió. Sólo cuentan los confirmados. */
export function calcularNetos(gastos: GastoCalculo[], pagos: PagoCalculo[]) {
  const netos = new Map<string, number>();
  const sumar = (personaId: string, monto: number) => netos.set(personaId, (netos.get(personaId) ?? 0) + monto);
  for (const gasto of gastos) {
    for (const parte of gasto.partes) {
      sumar(gasto.pagoId, parte.monto);
      sumar(parte.personaId, -parte.monto);
    }
  }
  for (const pago of pagos) {
    if (pago.estado !== "confirmado") continue;
    sumar(pago.deudorId, pago.monto);
    sumar(pago.acreedorId, -pago.monto);
  }
  return netos;
}

/** Cada uno le pone a quien pagó su parte; las dos direcciones de cada par se cancelan. */
export function transferenciasDirectas(gastos: GastoCalculo[], pagos: PagoCalculo[]): Transferencia[] {
  // Clave: los dos ids en orden. Positivo: el primero le pone al segundo.
  const pares = new Map<string, { primero: string; segundo: string; monto: number }>();
  const anotar = (de: string, a: string, monto: number) => {
    const [primero, segundo] = porId(de, a) < 0 ? [de, a] : [a, de];
    const clave = `${primero}|${segundo}`;
    const par = pares.get(clave) ?? { primero, segundo, monto: 0 };
    par.monto += primero === de ? monto : -monto;
    pares.set(clave, par);
  };
  for (const gasto of gastos) {
    for (const parte of gasto.partes) {
      if (parte.personaId !== gasto.pagoId) anotar(parte.personaId, gasto.pagoId, parte.monto);
    }
  }
  for (const pago of pagos) {
    if (pago.estado === "confirmado") anotar(pago.deudorId, pago.acreedorId, -pago.monto);
  }
  return [...pares.values()]
    .filter((par) => par.monto !== 0)
    .map((par) =>
      par.monto > 0
        ? { de: par.primero, a: par.segundo, monto: par.monto }
        : { de: par.segundo, a: par.primero, monto: -par.monto },
    );
}

/** Quien más tiene que poner le paga a quien más le deben, hasta que todos queden en 0. */
export function transferenciasSimplificadas(netos: Map<string, number>): Transferencia[] {
  const saldos = new Map(netos);
  const transferencias: Transferencia[] = [];
  for (;;) {
    const orden = [...saldos.entries()].sort(([idA, a], [idB, b]) => a - b || porId(idA, idB));
    const deudor = orden[0];
    const acreedor = orden.filter(([, saldo]) => saldo > 0).sort(([idA, a], [idB, b]) => b - a || porId(idA, idB))[0];
    if (!deudor || !acreedor || deudor[1] >= 0) return transferencias;
    const monto = Math.min(-deudor[1], acreedor[1]);
    transferencias.push({ de: deudor[0], a: acreedor[0], monto });
    saldos.set(deudor[0], deudor[1] + monto);
    saldos.set(acreedor[0], acreedor[1] - monto);
  }
}

/**
 * Cómo está cada persona con "vos". Positivo: te devuelve. Negativo: le tenés que poner.
 * Quien no aparece está a mano.
 */
export function saldosPara(yo: string, transferencias: Transferencia[]) {
  const saldos = new Map<string, number>();
  const sumar = (personaId: string, monto: number) => saldos.set(personaId, (saldos.get(personaId) ?? 0) + monto);
  for (const transferencia of transferencias) {
    if (transferencia.a === yo) sumar(transferencia.de, transferencia.monto);
    if (transferencia.de === yo) sumar(transferencia.a, -transferencia.monto);
  }
  return saldos;
}
