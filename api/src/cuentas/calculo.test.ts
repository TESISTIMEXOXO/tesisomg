import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularNetos,
  dividirIguales,
  dividirPorConsumo,
  saldosPara,
  transferenciasDirectas,
  transferenciasSimplificadas,
  type GastoCalculo,
  type PagoCalculo,
} from "./calculo.js";

// El ejemplo de docs/cuentas.md es el fixture: Nacho es quien usa la app.
const NACHO = "nacho";
const FEDE = "fede";
const SANTI = "santi";
const PEDRO = "pedro";

const cena = dividirPorConsumo(
  [
    { personaId: NACHO, monto: 8000 },
    { personaId: FEDE, monto: 12000 },
    { personaId: SANTI, monto: 5000 },
  ],
  10,
);

const GASTOS: GastoCalculo[] = [
  { pagoId: FEDE, partes: dividirIguales(120000, [NACHO, FEDE, SANTI, PEDRO], FEDE) },
  { pagoId: PEDRO, partes: dividirIguales(10000, [PEDRO, NACHO, SANTI], PEDRO) },
  { pagoId: NACHO, partes: cena.partes },
];

const pagoDeNacho = (estado: PagoCalculo["estado"]): PagoCalculo => ({
  deudorId: NACHO,
  acreedorId: FEDE,
  monto: 14633,
  estado,
});

const montos = (partes: { personaId: string; monto: number }[]) =>
  Object.fromEntries(partes.map((parte) => [parte.personaId, parte.monto]));

test("$ 120.000 en iguales entre 4 son 30.000 cada uno", () => {
  assert.deepEqual(montos(dividirIguales(120000, [NACHO, FEDE, SANTI, PEDRO], FEDE)), {
    [NACHO]: 30000,
    [FEDE]: 30000,
    [SANTI]: 30000,
    [PEDRO]: 30000,
  });
});

test("$ 10.000 entre Pedro (que pagó), Nacho y Santi: el peso que sobra va a Pedro", () => {
  assert.deepEqual(montos(dividirIguales(10000, [NACHO, SANTI, PEDRO], PEDRO)), {
    [PEDRO]: 3334,
    [NACHO]: 3333,
    [SANTI]: 3333,
  });
});

test("$ 1.001 entre 3 si quien pagó no participa: sobran 2 y van por id", () => {
  assert.deepEqual(montos(dividirIguales(1001, ["c", "a", "b"], "z")), { a: 334, b: 334, c: 333 });
});

test("consumo 8.000 / 12.000 / 5.000 + 10% da 8.800 / 13.200 / 5.500, total 27.500", () => {
  assert.deepEqual(montos(cena.partes), { [NACHO]: 8800, [FEDE]: 13200, [SANTI]: 5500 });
  assert.equal(cena.propina, 2500);
  assert.equal(cena.monto, 27500);
});

test("consumo 333 / 333 / 334 + 10%: el peso que sobra va a la fracción más grande", () => {
  const { partes } = dividirPorConsumo(
    [
      { personaId: "a", monto: 333 },
      { personaId: "b", monto: 333 },
      { personaId: "c", monto: 334 },
    ],
    10,
  );
  assert.deepEqual(montos(partes), { a: 366, b: 366, c: 368 });
});

test("con fracciones empatadas, el peso que sobra se define por id", () => {
  const { partes } = dividirPorConsumo(
    [
      { personaId: "b", monto: 5 },
      { personaId: "a", monto: 5 },
    ],
    10,
  );
  assert.deepEqual(montos(partes), { a: 6, b: 5 });
});

test("con los montos más grandes, la propina reparte exacto", () => {
  const { partes, monto } = dividirPorConsumo(
    [
      { personaId: "a", monto: 99999999 },
      { personaId: "b", monto: 1 },
    ],
    100,
  );
  assert.equal(monto, 200000000);
  assert.deepEqual(montos(partes), { a: 199999998, b: 2 });
});

test("netos del ejemplo: +76.800 / −14.633 / −38.833 / −23.334, que suman 0", () => {
  const netos = calcularNetos(GASTOS, []);
  assert.equal(netos.get(FEDE), 76800);
  assert.equal(netos.get(NACHO), -14633);
  assert.equal(netos.get(SANTI), -38833);
  assert.equal(netos.get(PEDRO), -23334);
  assert.equal([...netos.values()].reduce((total, neto) => total + neto, 0), 0);
});

test("directo: 6 transferencias, y Nacho ve Fede −16.800, Santi +5.500, Pedro −3.333", () => {
  const transferencias = transferenciasDirectas(GASTOS, []);
  assert.equal(transferencias.length, 6);
  const saldos = saldosPara(NACHO, transferencias);
  assert.equal(saldos.get(FEDE), -16800);
  assert.equal(saldos.get(SANTI), 5500);
  assert.equal(saldos.get(PEDRO), -3333);
});

test("simplificado: 3 transferencias, y Nacho ve Fede −14.633 y 0 con el resto", () => {
  const transferencias = transferenciasSimplificadas(calcularNetos(GASTOS, []));
  assert.equal(transferencias.length, 3);
  const saldos = saldosPara(NACHO, transferencias);
  assert.equal(saldos.get(FEDE), -14633);
  assert.equal(saldos.get(SANTI) ?? 0, 0);
  assert.equal(saldos.get(PEDRO) ?? 0, 0);
});

test("el pago de $ 14.633 de Nacho a Fede, ya confirmado, lo deja a mano con todos", () => {
  const transferencias = transferenciasSimplificadas(calcularNetos(GASTOS, [pagoDeNacho("confirmado")]));
  assert.equal(saldosPara(NACHO, transferencias).size, 0);
});

test("un pago pendiente o rechazado no cambia nada", () => {
  for (const estado of ["pendiente", "rechazado"] as const) {
    const pagos = [pagoDeNacho(estado)];
    assert.deepEqual(calcularNetos(GASTOS, pagos), calcularNetos(GASTOS, []));
    assert.deepEqual(transferenciasDirectas(GASTOS, pagos), transferenciasDirectas(GASTOS, []));
  }
});
