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

const BASE_DE_PRUEBA = "pinz_test";

type Saldos = { saldos: { persona: { nombre: string }; monto: number; pagoEnviado: { id: string; monto: number } | null }[] };
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
    pagosConfirmados: [],
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
