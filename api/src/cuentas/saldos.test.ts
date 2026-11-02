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

let servidor: Server;
let url: string;
let viajeId: string;
const ids: Record<string, string> = {};

async function cookieDe(usuarioId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(config.sesionSecreto));
  return `${COOKIE_SESION}=${token}`;
}

async function saldosDe(usuarioId: string) {
  return fetch(`${url}/viajes/${viajeId}/gastos/saldos`, { headers: { cookie: await cookieDe(usuarioId) } });
}

before(async () => {
  const uri = new URL(config.mongoUri);
  uri.pathname = `/${BASE_DE_PRUEBA}`;
  await mongoose.connect(uri.toString());
  assert.equal(mongoose.connection.name, BASE_DE_PRUEBA);
  await mongoose.connection.dropDatabase();

  const nombres = ["Nacho", "Fede", "Santi", "Pedro", "Ajena"];
  for (const nombre of nombres) {
    const usuario = await Usuario.create({ email: `${nombre}@prueba.pinz`, nombre });
    ids[nombre] = usuario.id;
  }
  const objeto = (nombre: string) => new mongoose.Types.ObjectId(ids[nombre]);
  const gasto = (descripcion: string, monto: number, pago: string, participantes: string[]) => ({
    id: crypto.randomUUID(),
    descripcion,
    monto,
    pagoId: objeto(pago),
    fecha: "2026-10-27",
    division: participantes.length > 0 ? ("consumo" as const) : ("iguales" as const),
    participantes: participantes.map(objeto),
    pagosConfirmados: [],
  });
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
    // El ejemplo de docs/cuentas.md, sin propina ni montos por persona: eso llega en el paso 3.
    gastos: [
      gasto("Seña de la cabaña", 120000, "Fede", []),
      gasto("Súper", 10000, "Pedro", ["Pedro", "Nacho", "Santi"]),
      gasto("Cena", 25000, "Nacho", ["Nacho", "Fede", "Santi"]),
    ],
  });
  viajeId = viaje.id;

  servidor = app.listen(0);
  url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((listo) => servidor.close(listo));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("/saldos dice que Nacho le tiene que poner a Fede, no la posición de Fede con el grupo", async () => {
  const respuesta = await saldosDe(ids.Nacho as string);
  assert.equal(respuesta.status, 200);
  const cuerpo = (await respuesta.json()) as { saldos: { persona: { nombre: string }; monto: number }[] };
  const montos = Object.fromEntries(cuerpo.saldos.map((saldo) => [saldo.persona.nombre, saldo.monto]));
  assert.deepEqual(montos, { Fede: -21667, Santi: 8333, Pedro: -3333 });
});

test("/saldos da vuelta el signo según quién mira", async () => {
  const respuesta = await saldosDe(ids.Fede as string);
  const cuerpo = (await respuesta.json()) as { saldos: { persona: { nombre: string }; monto: number }[] };
  const nacho = cuerpo.saldos.find((saldo) => saldo.persona.nombre === "Nacho");
  assert.equal(nacho?.monto, 21667);
});

test("a quien no es del viaje le responde 404 no-existe", async () => {
  const respuesta = await saldosDe(ids.Ajena as string);
  assert.equal(respuesta.status, 404);
  assert.deepEqual(await respuesta.json(), { error: "no-existe" });
});
