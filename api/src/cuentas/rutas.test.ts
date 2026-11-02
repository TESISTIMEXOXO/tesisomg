import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { SignJWT } from "jose";
import mongoose from "mongoose";
import { app } from "../app.js";
import { COOKIE_SESION } from "../auth/sesion.js";
import { config } from "../config.js";
import { Usuario } from "../modelos/Usuario.js";
import { Viaje } from "../modelos/Viaje.js";
import { migrarCuentas } from "./migracion.js";

const BASE_DE_PRUEBA = "pinz_test";

type Saldos = { saldos: { persona: { nombre: string }; monto: number; pagoEnviado: { id: string; monto: number } | null }[] };
type GastoApi = { id: string; descripcion: string; monto: number; propina: number; pagoId: string; creadoPorId: string; partes: { personaId: string; monto: number }[] };
type Pago = { id: string; deudorId: string; acreedorId: string; monto: number; estado: string };

let servidor: Server;
let url: string;
const ids: Record<string, string> = {};
const idDe = (nombre: string) => ids[nombre] as string;
const objeto = (nombre: string) => new mongoose.Types.ObjectId(idDe(nombre));

async function api<T = unknown>(quien: string, metodo: string, ruta: string, cuerpo?: unknown) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(idDe(quien))
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(config.sesionSecreto));
  const respuesta = await fetch(`${url}${ruta}`, {
    method: metodo,
    headers: {
      cookie: `${COOKIE_SESION}=${token}`,
      ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, cuerpo: (texto ? JSON.parse(texto) : null) as T };
}

function gastoViejo(descripcion: string, monto: number, pago: string, participantes: string[]) {
  return {
    id: crypto.randomUUID(),
    descripcion,
    monto,
    pagoId: objeto(pago),
    fecha: "2026-10-27",
    division: participantes.length > 0 ? ("consumo" as const) : ("iguales" as const),
    participantes: participantes.map(objeto),
  };
}

/** El ejemplo de docs/cuentas.md, sin propina ni montos por persona: un viaje por prueba. */
async function viajeDeEjemplo() {
  const viaje = await Viaje.create({
    nombre: "Cabaña",
    destino: "Bariloche",
    creadoPor: objeto("Nacho"),
    codigoInvitacion: crypto.randomUUID(),
    miembros: ["Nacho", "Fede", "Santi", "Pedro"].map((nombre, indice) => ({
      usuarioId: objeto(nombre),
      nombre,
      rol: indice === 0 ? "organizador" : "miembro",
    })),
    gastos: [
      gastoViejo("Seña de la cabaña", 120000, "Fede", []),
      gastoViejo("Súper", 10000, "Pedro", ["Pedro", "Nacho", "Santi"]),
      gastoViejo("Cena", 25000, "Nacho", ["Nacho", "Fede", "Santi"]),
    ],
  });
  return viaje.id as string;
}

async function montosDe(quien: string, viajeId: string) {
  const { cuerpo } = await api<Saldos>(quien, "GET", `/viajes/${viajeId}/gastos/saldos`);
  return Object.fromEntries(cuerpo.saldos.map((saldo) => [saldo.persona.nombre, saldo.monto]));
}

before(async () => {
  const uri = new URL(config.mongoUri);
  uri.pathname = `/${BASE_DE_PRUEBA}`;
  await mongoose.connect(uri.toString());
  assert.equal(mongoose.connection.name, BASE_DE_PRUEBA);
  await mongoose.connection.dropDatabase();
  for (const nombre of ["Nacho", "Fede", "Santi", "Pedro", "Lola", "Ajena"]) {
    const usuario = await Usuario.create({ email: `${nombre}@prueba.pinz`, nombre });
    ids[nombre] = usuario.id;
  }
  servidor = app.listen(0);
  url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((listo) => servidor.close(listo));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("/saldos dice que Nacho le tiene que poner a Fede, no la posición de Fede con el grupo", async () => {
  const viajeId = await viajeDeEjemplo();
  assert.deepEqual(await montosDe("Nacho", viajeId), { Fede: -21667, Santi: 8333, Pedro: -3333 });
});

test("/saldos da vuelta el signo según quién mira", async () => {
  const viajeId = await viajeDeEjemplo();
  assert.equal((await montosDe("Fede", viajeId)).Nacho, 21667);
});

test("a quien no es del viaje o en un viaje que no existe le responde 404 no-existe", async () => {
  const viajeId = await viajeDeEjemplo();
  const ajena = await api("Ajena", "GET", `/viajes/${viajeId}/gastos/saldos`);
  assert.equal(ajena.status, 404);
  assert.deepEqual(ajena.cuerpo, { error: "no-existe" });
  const inventado = await api("Nacho", "GET", `/viajes/${new mongoose.Types.ObjectId().toString()}/gastos/saldos`);
  assert.equal(inventado.status, 404);
});

test('"Pagar" de Nacho a Fede guarda a Nacho como deudor, a Fede como acreedor y queda pendiente', async () => {
  const viajeId = await viajeDeEjemplo();
  const { status, cuerpo } = await api<Pago>("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  assert.equal(status, 201);
  assert.equal(cuerpo.deudorId, idDe("Nacho"));
  assert.equal(cuerpo.acreedorId, idDe("Fede"));
  assert.equal(cuerpo.monto, 21667);
  assert.equal(cuerpo.estado, "pendiente");
  const saldos = await api<Saldos>("Nacho", "GET", `/viajes/${viajeId}/gastos/saldos`);
  const fede = saldos.cuerpo.saldos.find((saldo) => saldo.persona.nombre === "Fede");
  assert.equal(fede?.monto, -21667);
  assert.deepEqual(fede?.pagoEnviado, { id: cuerpo.id, monto: 21667 });
});

test("Nacho le paga a Fede, Fede confirma y los dos quedan a mano", async () => {
  const viajeId = await viajeDeEjemplo();
  const { cuerpo: pago } = await api<Pago>("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  const confirmado = await api<Pago>("Fede", "POST", `/viajes/${viajeId}/gastos/pagos/${pago.id}/confirmar`);
  assert.equal(confirmado.status, 200);
  assert.equal(confirmado.cuerpo.estado, "confirmado");
  assert.equal((await montosDe("Nacho", viajeId)).Fede, 0);
  assert.equal((await montosDe("Fede", viajeId)).Nacho, 0);
});

test("un pago rechazado no cambia los saldos y se puede volver a registrar", async () => {
  const viajeId = await viajeDeEjemplo();
  const { cuerpo: pago } = await api<Pago>("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  const rechazado = await api<Pago>("Fede", "POST", `/viajes/${viajeId}/gastos/pagos/${pago.id}/rechazar`);
  assert.equal(rechazado.cuerpo.estado, "rechazado");
  assert.equal((await montosDe("Nacho", viajeId)).Fede, -21667);
  const otro = await api("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  assert.equal(otro.status, 201);
});

test("sólo quien recibe el pago lo confirma o rechaza; cualquier otro recibe 403 sin-permiso", async () => {
  const viajeId = await viajeDeEjemplo();
  const { cuerpo: pago } = await api<Pago>("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  for (const quien of ["Nacho", "Santi"]) {
    for (const accion of ["confirmar", "rechazar"]) {
      const respuesta = await api(quien, "POST", `/viajes/${viajeId}/gastos/pagos/${pago.id}/${accion}`);
      assert.equal(respuesta.status, 403);
      assert.deepEqual(respuesta.cuerpo, { error: "sin-permiso" });
    }
  }
});

test("un segundo pago con uno pendiente da 409 pago-ya-pendiente; sin deuda, 409 sin-deuda-pendiente", async () => {
  const viajeId = await viajeDeEjemplo();
  await api("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  const segundo = await api("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  assert.equal(segundo.status, 409);
  assert.deepEqual(segundo.cuerpo, { error: "pago-ya-pendiente" });
  const sinDeuda = await api("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Santi") });
  assert.equal(sinDeuda.status, 409);
  assert.deepEqual(sinDeuda.cuerpo, { error: "sin-deuda-pendiente" });
});

test("los pagos guardados antes de este cambio cuentan como confirmados", async () => {
  const viajeId = await viajeDeEjemplo();
  await Viaje.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(viajeId) },
    { $push: { pagos: { deudorId: objeto("Nacho"), acreedorId: objeto("Fede"), monto: 1000, fecha: "2026-10-20" } } as never },
  );
  assert.equal((await montosDe("Nacho", viajeId)).Fede, -20667);
});

test("GET /pagos devuelve los pagos, el más nuevo primero", async () => {
  const viajeId = await viajeDeEjemplo();
  await api("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  await api("Pedro", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  const { cuerpo } = await api<Pago[]>("Santi", "GET", `/viajes/${viajeId}/gastos/pagos`);
  assert.deepEqual(cuerpo.map((pago) => pago.deudorId), [idDe("Pedro"), idDe("Nacho")]);
});


async function viajeVacio(extra: { nombre: string; rol: "miembro" | "lector" }[] = []) {
  const viaje = await Viaje.create({
    nombre: "Cabaña",
    destino: "Bariloche",
    creadoPor: objeto("Nacho"),
    codigoInvitacion: crypto.randomUUID(),
    miembros: [
      { usuarioId: objeto("Nacho"), nombre: "Nacho", rol: "organizador" },
      ...["Fede", "Santi", "Pedro"].map((nombre) => ({ usuarioId: objeto(nombre), nombre, rol: "miembro" as const })),
      ...extra.map(({ nombre, rol }) => ({ usuarioId: objeto(nombre), nombre, rol })),
    ],
  });
  return viaje.id as string;
}

async function cargarEjemplo(viajeId: string) {
  const ruta = `/viajes/${viajeId}/gastos`;
  await api("Nacho", "POST", ruta, { descripcion: "Seña de la cabaña", monto: 120000, division: "iguales", pagoId: idDe("Fede") });
  await api("Pedro", "POST", ruta, {
    descripcion: "Súper",
    monto: 10000,
    division: "iguales",
    participantes: [idDe("Pedro"), idDe("Nacho"), idDe("Santi")],
  });
  return api<GastoApi>("Nacho", "POST", ruta, {
    descripcion: "Cena",
    monto: 25000,
    division: "consumo",
    fecha: "2026-10-27",
    consumos: [
      { personaId: idDe("Nacho"), monto: 8000 },
      { personaId: idDe("Fede"), monto: 12000 },
      { personaId: idDe("Santi"), monto: 5000 },
    ],
    propina: 10,
  });
}

test("los tres gastos del ejemplo, cargados por la API, dan los números de docs/cuentas.md", async () => {
  const viajeId = await viajeVacio();
  const cena = await cargarEjemplo(viajeId);
  assert.equal(cena.status, 201);
  assert.equal(cena.cuerpo.monto, 27500);
  assert.equal(cena.cuerpo.propina, 2500);
  assert.equal(cena.cuerpo.partes.find((parte) => parte.personaId === idDe("Fede"))?.monto, 13200);
  assert.deepEqual(await montosDe("Nacho", viajeId), { Fede: -16800, Santi: 5500, Pedro: -3333 });
});

test("consumos que no suman el monto dan 400 consumos-no-suman", async () => {
  const viajeId = await viajeVacio();
  const respuesta = await api("Nacho", "POST", `/viajes/${viajeId}/gastos`, {
    descripcion: "Cena",
    monto: 25000,
    division: "consumo",
    consumos: [{ personaId: idDe("Nacho"), monto: 8000 }],
  });
  assert.equal(respuesta.status, 400);
  assert.deepEqual(respuesta.cuerpo, { error: "consumos-no-suman" });
});

test("los datos mal formados dan 400 datos-invalidos", async () => {
  const viajeId = await viajeVacio();
  const ruta = `/viajes/${viajeId}/gastos`;
  const malos = [
    { descripcion: "", monto: 100, division: "iguales" },
    { descripcion: "x", monto: 100000001, division: "iguales" },
    { descripcion: "x", monto: 100, division: "iguales", participantes: [idDe("Nacho"), idDe("Nacho")] },
    { descripcion: "x", monto: 2, division: "iguales" },
  ];
  for (const malo of malos) {
    const respuesta = await api<{ error: string }>("Nacho", "POST", ruta, malo);
    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.cuerpo.error, "datos-invalidos");
  }
});

test("un participante que no es del viaje da 400 participante-no-es-miembro", async () => {
  const viajeId = await viajeVacio();
  const respuesta = await api("Nacho", "POST", `/viajes/${viajeId}/gastos`, {
    descripcion: "x",
    monto: 100,
    division: "iguales",
    participantes: [idDe("Ajena")],
  });
  assert.deepEqual(respuesta.cuerpo, { error: "participante-no-es-miembro" });
});

test("un lector no carga gastos (403), pero participa y puede pagar", async () => {
  const viajeId = await viajeVacio([{ nombre: "Lola", rol: "lector" }]);
  const ruta = `/viajes/${viajeId}/gastos`;
  const carga = await api("Lola", "POST", ruta, { descripcion: "x", monto: 100, division: "iguales" });
  assert.equal(carga.status, 403);
  assert.deepEqual(carga.cuerpo, { error: "sin-permiso" });
  await api("Nacho", "POST", ruta, { descripcion: "Nafta", monto: 500, division: "iguales" });
  const pago = await api("Lola", "POST", `${ruta}/pagos`, { personaId: idDe("Nacho") });
  assert.equal(pago.status, 201);
});

test("editar o borrar un gasto ajeno como miembro da 403; como organizador se puede", async () => {
  const viajeId = await viajeVacio();
  const ruta = `/viajes/${viajeId}/gastos`;
  const { cuerpo: gasto } = await api<GastoApi>("Pedro", "POST", ruta, { descripcion: "Súper", monto: 4000, division: "iguales" });
  const cambio = { descripcion: "Súper grande", monto: 8000, division: "iguales" };
  assert.equal((await api("Santi", "PATCH", `${ruta}/${gasto.id}`, cambio)).status, 403);
  assert.equal((await api("Santi", "DELETE", `${ruta}/${gasto.id}`)).status, 403);
  const editado = await api<GastoApi>("Nacho", "PATCH", `${ruta}/${gasto.id}`, cambio);
  assert.equal(editado.status, 200);
  assert.equal(editado.cuerpo.monto, 8000);
  assert.equal(editado.cuerpo.pagoId, idDe("Pedro"));
  assert.equal(editado.cuerpo.creadoPorId, idDe("Pedro"));
  assert.equal(editado.cuerpo.partes.find((parte) => parte.personaId === idDe("Fede"))?.monto, 2000);
  assert.equal((await api("Nacho", "DELETE", `${ruta}/${gasto.id}`)).status, 204);
});

test("quien cargó un gasto lo puede editar aunque lo haya pagado otro", async () => {
  const viajeId = await viajeVacio();
  const ruta = `/viajes/${viajeId}/gastos`;
  const { cuerpo: gasto } = await api<GastoApi>("Santi", "POST", ruta, { descripcion: "Taxi", monto: 400, division: "iguales", pagoId: idDe("Pedro") });
  const editado = await api("Santi", "PATCH", `${ruta}/${gasto.id}`, { descripcion: "Taxi al centro", monto: 400, division: "iguales" });
  assert.equal(editado.status, 200);
  assert.equal((await api("Pedro", "DELETE", `${ruta}/${gasto.id}`)).status, 403);
});

test("borrar un gasto actualiza los saldos de todos", async () => {
  const viajeId = await viajeVacio();
  await cargarEjemplo(viajeId);
  const { cuerpo: gastos } = await api<GastoApi[]>("Nacho", "GET", `/viajes/${viajeId}/gastos`);
  const cena = gastos.find((gasto) => gasto.descripcion === "Cena");
  await api("Nacho", "DELETE", `/viajes/${viajeId}/gastos/${cena?.id}`);
  assert.deepEqual(await montosDe("Nacho", viajeId), { Fede: -30000, Santi: 0, Pedro: -3333 });
  assert.equal((await montosDe("Santi", viajeId)).Fede, -30000);
});

test("la migración completa partes, propina, autor y estado, y se puede correr dos veces", async () => {
  const viajeId = await viajeDeEjemplo();
  await Viaje.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(viajeId) },
    { $push: { pagos: { deudorId: objeto("Nacho"), acreedorId: objeto("Fede"), monto: 1000, fecha: "2026-10-20" } } as never },
  );
  const antes = await montosDe("Nacho", viajeId);
  await migrarCuentas();
  await migrarCuentas();
  const crudo = await Viaje.collection.findOne({ _id: new mongoose.Types.ObjectId(viajeId) });
  const gasto = crudo?.gastos[0];
  assert.equal(gasto.partes.length, 4);
  assert.equal(gasto.propina, 0);
  assert.equal(String(gasto.creadoPorId), idDe("Fede"));
  assert.equal("pagosConfirmados" in gasto, false);
  assert.equal(crudo?.pagos[0].estado, "confirmado");
  assert.equal(typeof crudo?.pagos[0].id, "string");
  assert.deepEqual(await montosDe("Nacho", viajeId), antes);
});

test('después de "Simplificar cuentas", Nacho ve Fede −14.633 y 0 con el resto', async () => {
  const viajeId = await viajeVacio();
  await cargarEjemplo(viajeId);
  const respuesta = await api<Saldos & { simplificadas: boolean; moneda: string }>("Nacho", "POST", `/viajes/${viajeId}/gastos/simplificar`);
  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.cuerpo.simplificadas, true);
  assert.deepEqual(await montosDe("Nacho", viajeId), { Fede: -14633, Santi: 0, Pedro: 0 });
  const viaje = await Viaje.findById(viajeId);
  assert.equal(viaje?.cuentasSimplificadas, true);
});

test("con cuentas simplificadas, pagar los $ 14.633 deja a Nacho a mano con todos", async () => {
  const viajeId = await viajeVacio();
  await cargarEjemplo(viajeId);
  await api("Nacho", "POST", `/viajes/${viajeId}/gastos/simplificar`);
  const { cuerpo: pago } = await api<Pago>("Nacho", "POST", `/viajes/${viajeId}/gastos/pagos`, { personaId: idDe("Fede") });
  assert.equal(pago.monto, 14633);
  await api("Fede", "POST", `/viajes/${viajeId}/gastos/pagos/${pago.id}/confirmar`);
  assert.deepEqual(await montosDe("Nacho", viajeId), { Fede: 0, Santi: 0, Pedro: 0 });
});

test("un lector no puede simplificar las cuentas", async () => {
  const viajeId = await viajeVacio([{ nombre: "Lola", rol: "lector" }]);
  const respuesta = await api("Lola", "POST", `/viajes/${viajeId}/gastos/simplificar`);
  assert.equal(respuesta.status, 403);
});

test("los saldos usan la moneda del viaje, no la de quien mira, y crear un viaje copia la del creador", async () => {
  await Usuario.updateOne({ _id: idDe("Lola") }, { moneda: "USD" });
  const { cuerpo: viaje } = await api<{ id: string }>("Lola", "POST", "/viajes", { nombre: "Nueva York", destino: "Nueva York", fechaIda: null, fechaVuelta: null, ubicacion: null });
  await Viaje.updateOne({ _id: viaje.id }, { $push: { miembros: { usuarioId: objeto("Nacho"), nombre: "Nacho", rol: "miembro" } } });
  const { cuerpo } = await api<{ moneda: string }>("Nacho", "GET", `/viajes/${viaje.id}/gastos/saldos`);
  assert.equal(cuerpo.moneda, "USD");
});
