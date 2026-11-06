import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { SignJWT } from "jose";
import mongoose from "mongoose";
import { app } from "../app.js";
import { COOKIE_SESION } from "../auth/sesion.js";
import { config } from "../config.js";
import { Documento } from "../modelos/Documento.js";
import { Usuario } from "../modelos/Usuario.js";
import { Viaje } from "../modelos/Viaje.js";
import { lector, type Lectura } from "./comprobante.js";
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

async function cookieDe(quien: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(idDe(quien))
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(config.sesionSecreto));
  return `${COOKIE_SESION}=${token}`;
}

async function api<T = unknown>(quien: string, metodo: string, ruta: string, cuerpo?: unknown) {
  const respuesta = await fetch(`${url}${ruta}`, {
    method: metodo,
    headers: {
      cookie: await cookieDe(quien),
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
  const { cuerpo: viaje } = await api<{ id: string }>("Lola", "POST", "/viajes", {
    nombre: "Nueva York",
    destino: "Nueva York",
    fechaIda: null,
    fechaVuelta: null,
    ubicacion: null,
    etapas: [{ destino: "Nueva York", fechaIda: null, fechaVuelta: null, ubicacion: { nombre: "Nueva York", lat: 40.7, lng: -74 } }],
  });
  await Viaje.updateOne({ _id: viaje.id }, { $push: { miembros: { usuarioId: objeto("Nacho"), nombre: "Nacho", rol: "miembro" } } });
  const { cuerpo } = await api<{ moneda: string }>("Nacho", "GET", `/viajes/${viaje.id}/gastos/saldos`);
  assert.equal(cuerpo.moneda, "USD");
});

test("cuando el último saldo llega a 0 queda todos a mano, y recién ahí se puede salir del viaje", async () => {
  const viajeId = await viajeVacio();
  const ruta = `/viajes/${viajeId}/gastos`;
  const estado = async () => (await api<{ estadoCuentas: string | null }>("Nacho", "GET", `/viajes/${viajeId}`)).cuerpo.estadoCuentas;
  assert.equal(await estado(), null);

  await api("Santi", "POST", ruta, { descripcion: "Taxi", monto: 400, division: "iguales", participantes: [idDe("Santi"), idDe("Pedro")] });
  assert.equal(await estado(), null);
  const salida = await api("Pedro", "DELETE", `/viajes/${viajeId}/miembros/yo`);
  assert.equal(salida.status, 409);
  assert.deepEqual(salida.cuerpo, { error: "saldo-pendiente" });

  const { cuerpo: pago } = await api<Pago>("Pedro", "POST", `${ruta}/pagos`, { personaId: idDe("Santi") });
  assert.equal((await api("Pedro", "DELETE", `/viajes/${viajeId}/miembros/yo`)).status, 409);
  await api("Santi", "POST", `${ruta}/pagos/${pago.id}/confirmar`);
  assert.equal(await estado(), "todos a mano");
  assert.equal((await api("Pedro", "DELETE", `/viajes/${viajeId}/miembros/yo`)).status, 204);
});

test("cada cambio en las cuentas deja una línea en los movimientos", async () => {
  const viajeId = await viajeVacio();
  const ruta = `/viajes/${viajeId}/gastos`;
  const { cuerpo: gasto } = await api<GastoApi>("Santi", "POST", ruta, { descripcion: "Taxi", monto: 400, division: "iguales", participantes: [idDe("Santi"), idDe("Pedro")] });
  await api("Santi", "PATCH", `${ruta}/${gasto.id}`, { descripcion: "Remís", monto: 600, division: "iguales", participantes: [idDe("Santi"), idDe("Pedro")] });
  const { cuerpo: pago } = await api<Pago>("Pedro", "POST", `${ruta}/pagos`, { personaId: idDe("Santi") });
  await api("Santi", "POST", `${ruta}/pagos/${pago.id}/rechazar`);
  await api("Santi", "DELETE", `${ruta}/${gasto.id}`);
  const viaje = await Viaje.findById(viajeId);
  assert.deepEqual(viaje?.movimientos.map((movimiento) => movimiento.texto), [
    "Santi cargó “Taxi”",
    "Santi editó “Remís”",
    "Pedro registró un pago a Santi",
    "Santi rechazó el pago de Pedro",
    "Santi borró “Remís”",
  ]);
});

const LECTURA: Lectura = { legible: true, descripcion: "Supermercado Día", monto: 15320.5, fecha: "2026-10-27", moneda: "ARS" };

async function subirComprobante(quien: string, viajeId: string, tipo = "image/jpeg", tamano = 10) {
  const form = new FormData();
  form.set("archivo", new Blob([new Uint8Array(tamano)], { type: tipo }), "ticket");
  const respuesta = await fetch(`${url}/viajes/${viajeId}/gastos/comprobante`, {
    method: "POST",
    headers: { cookie: await cookieDe(quien) },
    body: form,
  });
  return { status: respuesta.status, cuerpo: (await respuesta.json()) as Record<string, unknown> };
}

function conLector(leer: typeof lector.leer) {
  const original = lector.leer;
  lector.leer = leer;
  return () => {
    lector.leer = original;
  };
}

test("leer un comprobante devuelve la sugerencia redondeada y no guarda nada", async (t) => {
  t.after(conLector(async () => LECTURA));
  const viajeId = await viajeVacio();
  const { status, cuerpo } = await subirComprobante("Nacho", viajeId);
  assert.equal(status, 200);
  assert.deepEqual(cuerpo, { descripcion: "Supermercado Día", monto: 15321, fecha: "2026-10-27", moneda: "ARS", monedaDistinta: false });
  const viaje = await Viaje.findById(viajeId);
  assert.equal(viaje?.gastos.length, 0);
  assert.equal(await Documento.countDocuments({ viajeId }), 0);
});

test("una fecha imposible o en otro formato no llega al formulario", async (t) => {
  for (const fecha of ["2026-02-31", "12/10/2026"]) {
    const deshacer = conLector(async () => ({ ...LECTURA, fecha }));
    const { status, cuerpo } = await subirComprobante("Nacho", await viajeVacio());
    deshacer();
    assert.equal(status, 200);
    assert.equal(cuerpo.fecha, null);
  }
  t.diagnostic("el resto de la lectura se mantiene");
});

test("un comprobante en otra moneda queda marcado", async (t) => {
  t.after(conLector(async () => ({ ...LECTURA, moneda: "brl" })));
  const { cuerpo } = await subirComprobante("Nacho", await viajeVacio());
  assert.equal(cuerpo.moneda, "BRL");
  assert.equal(cuerpo.monedaDistinta, true);
});

test("un comprobante ilegible o sin total da 422 comprobante-ilegible", async (t) => {
  const viajeId = await viajeVacio();
  for (const lectura of [{ ...LECTURA, legible: false }, { ...LECTURA, monto: null }, { ...LECTURA, monto: 0 }]) {
    const restaurar = conLector(async () => lectura);
    const { status, cuerpo } = await subirComprobante("Nacho", viajeId);
    restaurar();
    assert.equal(status, 422);
    assert.deepEqual(cuerpo, { error: "comprobante-ilegible" });
  }
  t.diagnostic("los tres casos responden igual");
});

test("una fecha mal escrita se descarta y queda la lectura", async (t) => {
  t.after(conLector(async () => ({ ...LECTURA, fecha: "27/10/2026" })));
  const { cuerpo } = await subirComprobante("Nacho", await viajeVacio());
  assert.equal(cuerpo.fecha, null);
});

test("sin clave configurada responde 503 lectura-no-disponible", async () => {
  const { status, cuerpo } = await subirComprobante("Nacho", await viajeVacio());
  assert.equal(status, 503);
  assert.deepEqual(cuerpo, { error: "lectura-no-disponible" });
});

test("si falla la lectura responde 502 lectura-fallo", async (t) => {
  t.after(conLector(async () => {
    throw new Error("sin servicio");
  }));
  const { status, cuerpo } = await subirComprobante("Nacho", await viajeVacio());
  assert.equal(status, 502);
  assert.deepEqual(cuerpo, { error: "lectura-fallo" });
});

test("un lector no puede escanear; un tipo no permitido da 400; una foto pesada, 413", async (t) => {
  t.after(conLector(async () => LECTURA));
  const viajeId = await viajeVacio([{ nombre: "Lola", rol: "lector" }]);
  assert.equal((await subirComprobante("Lola", viajeId)).status, 403);
  assert.equal((await subirComprobante("Ajena", viajeId)).status, 404);
  assert.deepEqual((await subirComprobante("Nacho", viajeId, "image/gif")).cuerpo, { error: "falta-archivo" });
  assert.equal((await subirComprobante("Nacho", viajeId, "image/jpeg", 4 * 1024 * 1024)).status, 413);
  assert.equal((await subirComprobante("Nacho", viajeId, "image/jpeg", 9 * 1024 * 1024)).status, 413);
});

type PersonaDelViaje = { id: string; nombre: string; rol: string };

async function personasDe(viajeId: string, quien = "Nacho") {
  return (await api<{ personas: PersonaDelViaje[] }>(quien, "GET", `/viajes/${viajeId}`)).cuerpo.personas;
}

test("el único organizador elige a quién deja la organización antes de salir", async () => {
  const viajeId = await viajeVacio();
  const salir = (cuerpo?: unknown) => api<{ error?: string }>("Nacho", "DELETE", `/viajes/${viajeId}/miembros/yo`, cuerpo);

  const sinElegir = await salir();
  assert.equal(sinElegir.status, 409);
  assert.deepEqual(sinElegir.cuerpo, { error: "elegir-nuevo-organizador" });
  // Alguien que no es del viaje no sirve como sucesor.
  assert.equal((await salir({ nuevoOrganizador: new mongoose.Types.ObjectId().toString() })).status, 409);

  assert.equal((await salir({ nuevoOrganizador: idDe("Fede") })).status, 204);
  const personas = await personasDe(viajeId, "Fede");
  assert.ok(!personas.some((persona) => persona.nombre === "Nacho"));
  assert.equal(personas.find((persona) => persona.nombre === "Fede")?.rol, "organizador");
});

test("si queda otro organizador, se puede salir sin elegir", async () => {
  const viajeId = await viajeVacio();
  await api("Nacho", "PATCH", `/viajes/${viajeId}/miembros/${idDe("Santi")}`, { rol: "organizador" });
  assert.equal((await api("Nacho", "DELETE", `/viajes/${viajeId}/miembros/yo`)).status, 204);
});

test("solo un organizador puede echar a alguien, y no con plata pendiente", async () => {
  const viajeId = await viajeVacio();
  const echar = (quien: string, a: string) => api<{ error?: string }>(quien, "DELETE", `/viajes/${viajeId}/miembros/${idDe(a)}`);

  assert.equal((await echar("Fede", "Santi")).status, 403);
  assert.equal((await echar("Nacho", "Nacho")).status, 400);

  await api("Santi", "POST", `/viajes/${viajeId}/gastos`, { descripcion: "Taxi", monto: 400, division: "iguales", participantes: [idDe("Santi"), idDe("Pedro")] });
  const conDeuda = await echar("Nacho", "Pedro");
  assert.equal(conDeuda.status, 409);
  assert.deepEqual(conDeuda.cuerpo, { error: "saldo-pendiente" });

  assert.equal((await echar("Nacho", "Fede")).status, 200);
  assert.ok(!(await personasDe(viajeId)).some((persona) => persona.nombre === "Fede"));
  // Ya no es del viaje: no lo puede ver, y la respuesta le dice que lo sacaron y quién.
  const visto = await api("Fede", "GET", `/viajes/${viajeId}`);
  assert.equal(visto.status, 410);
  assert.deepEqual(visto.cuerpo, { error: "te-sacaron", viaje: "Cabaña", por: "Nacho", baneado: false });
  // A alguien que nunca estuvo le sigue diciendo que no existe.
  assert.equal((await api("Pedro", "GET", `/viajes/${new mongoose.Types.ObjectId().toString()}`)).status, 404);
});

test("a la tercera vez que lo sacan, ya no puede volver al viaje", async () => {
  const viajeId = await viajeVacio();
  const codigo = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  await Viaje.updateOne({ _id: viajeId }, { $set: { codigoInvitacion: codigo } });
  const echar = () => api("Nacho", "DELETE", `/viajes/${viajeId}/miembros/${idDe("Fede")}`);
  const volver = () => api<{ error?: string }>("Fede", "POST", "/viajes/unirse", { codigo });
  const vecesQueVe = async (quien: string) =>
    (await personasDe(viajeId, quien)).find((persona) => persona.nombre === "Fede") as PersonaDelViaje & { vecesSacado?: number };

  // Dos strikes: lo sacan y vuelve con el link guardado.
  for (const vez of [1, 2]) {
    assert.equal((await echar()).status, 200);
    assert.equal((await volver()).status, 200);
    // El organizador ve cuántas veces lo sacaron; el resto del grupo, no.
    assert.equal((await vecesQueVe("Nacho")).vecesSacado, vez);
    assert.equal((await vecesQueVe("Santi")).vecesSacado, undefined);
  }
  // Si después sale solo, no se le avisa como si lo hubieran sacado.
  assert.equal((await api("Fede", "GET", `/viajes/${viajeId}`)).status, 200);

  // Tercer strike: baneado.
  assert.equal((await echar()).status, 200);
  const visto = await api("Fede", "GET", `/viajes/${viajeId}`);
  assert.equal(visto.status, 410);
  assert.deepEqual(visto.cuerpo, { error: "te-sacaron", viaje: "Cabaña", por: "Nacho", baneado: true });

  const otraVez = await volver();
  assert.equal(otraVez.status, 403);
  assert.deepEqual(otraVez.cuerpo, { error: "baneado", viaje: "Cabaña" });
  assert.equal((await api("Fede", "GET", `/viajes/invitacion/${codigo}`)).status, 403);
  assert.ok(!(await personasDe(viajeId)).some((persona) => persona.nombre === "Fede"));

  // Tampoco se lo puede invitar por mail.
  const invitacion = await api("Nacho", "POST", `/viajes/${viajeId}/invitar`, { email: "Fede@prueba.pinz" });
  assert.equal(invitacion.status, 409);
  assert.deepEqual(invitacion.cuerpo, { error: "persona-baneada" });

  // A otro sí lo dejan volver.
  assert.equal((await api("Nacho", "DELETE", `/viajes/${viajeId}/miembros/${idDe("Santi")}`)).status, 200);
  assert.equal((await api("Santi", "POST", "/viajes/unirse", { codigo })).status, 200);
});

type ViajeListado = { id: string };
type Sacado = { id: string; nombre: string; por: string; baneado: boolean };

test("un previaje o un viaje que ya pasó se borra solo de la lista de quien lo pide; uno en curso, no", async () => {
  const viajeId = await viajeVacio();
  const ocultar = (quien: string) => api<{ error?: string }>(quien, "POST", `/viajes/${viajeId}/ocultar`);
  const loVe = async (quien: string) => (await api<ViajeListado[]>(quien, "GET", "/viajes")).cuerpo.some((viaje) => viaje.id === viajeId);
  const fechas = (fechaIda: string | null, fechaVuelta: string | null) => Viaje.updateOne({ _id: viajeId }, { $set: { fechaIda, fechaVuelta } });
  const hoy = new Date().toISOString().slice(0, 10);

  // En curso no se puede: es el viaje que está pasando.
  await fechas("2020-01-01", "2099-01-10");
  const enCurso = await ocultar("Nacho");
  assert.equal(enCurso.status, 409);
  assert.deepEqual(enCurso.cuerpo, { error: "viaje-en-curso" });
  // El día que empieza (en algún lugar del mundo ya es ese día) tampoco.
  await fechas(hoy, null);
  assert.equal((await ocultar("Nacho")).status, 409);

  // Un previaje sin fechas sí: solo para quien lo pide.
  await fechas(null, null);
  assert.equal((await ocultar("Nacho")).status, 204);
  assert.equal(await loVe("Nacho"), false);
  assert.equal(await loVe("Fede"), true);
  // Sigue en el grupo: puede abrirlo con el link.
  assert.equal((await api("Nacho", "GET", `/viajes/${viajeId}`)).status, 200);

  // Si le ponen fechas y sigue sin empezar, o ya pasó, sigue borrado.
  await fechas("2099-01-01", "2099-01-10");
  assert.equal(await loVe("Nacho"), false);
  await fechas("2020-01-01", "2020-01-10");
  assert.equal(await loVe("Nacho"), false);
  // Si queda en curso, vuelve a aparecer.
  await fechas("2020-01-01", "2099-01-10");
  assert.equal(await loVe("Nacho"), true);

  // Un viaje que ya pasó, también.
  await fechas("2020-01-01", "2020-01-10");
  assert.equal((await ocultar("Fede")).status, 204);
  assert.equal(await loVe("Fede"), false);
});

test("los viajes de los que te sacaron se listan y se pueden borrar de la lista", async () => {
  const viajeId = await viajeVacio();
  const sacados = async (quien: string) => (await api<Sacado[]>(quien, "GET", "/viajes/sacados")).cuerpo.filter((viaje) => viaje.id === viajeId);

  assert.deepEqual(await sacados("Fede"), []);
  await api("Nacho", "DELETE", `/viajes/${viajeId}/miembros/${idDe("Fede")}`);
  const [sacado] = await sacados("Fede");
  assert.equal(sacado?.nombre, "Cabaña");
  assert.equal(sacado?.por, "Nacho");
  assert.equal(sacado?.baneado, false);

  // No hace falta que el viaje haya pasado.
  assert.equal((await api("Fede", "POST", `/viajes/${viajeId}/ocultar`)).status, 204);
  assert.deepEqual(await sacados("Fede"), []);

  // Alguien que nunca estuvo no puede tocarlo.
  const ajeno = await Usuario.create({ email: `ajeno-${crypto.randomUUID()}@prueba.pinz`, nombre: "Ajeno" });
  ids.Ajeno = ajeno.id as string;
  assert.equal((await api("Ajeno", "POST", `/viajes/${viajeId}/ocultar`)).status, 404);
  await ajeno.deleteOne();
});
