import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { SignJWT } from "jose";
import mongoose from "mongoose";
import { app } from "./app.js";
import { COOKIE_SESION } from "./auth/sesion.js";
import { config } from "./config.js";
import { Usuario } from "./modelos/Usuario.js";
import { Viaje } from "./modelos/Viaje.js";

// Base propia: las pruebas de Cuentas corren al mismo tiempo y borran la suya.
const BASE_DE_PRUEBA = "pinz_test_listas";

type Lista = { id: string; nombre: string; color: string; grupal: boolean; participantes: string[]; items: { id: string; titulo: string; hecha: boolean }[] };

let servidor: Server;
let url: string;
const ids: Record<string, string> = {};
const idDe = (nombre: string) => ids[nombre] as string;
const objeto = (nombre: string) => new mongoose.Types.ObjectId(idDe(nombre));

async function api<T = unknown>(quien: string, metodo: string, ruta: string, cuerpo?: unknown) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(idDe(quien)).setExpirationTime("1h").sign(new TextEncoder().encode(config.sesionSecreto));
  const respuesta = await fetch(`${url}${ruta}`, {
    method: metodo,
    headers: { cookie: `${COOKIE_SESION}=${token}`, ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, cuerpo: (texto ? JSON.parse(texto) : null) as T };
}

async function viajeNuevo(extra: Record<string, unknown> = {}) {
  const viaje = await Viaje.create({
    nombre: "Cabaña",
    destino: "Bariloche",
    creadoPor: objeto("Nacho"),
    codigoInvitacion: crypto.randomUUID(),
    miembros: [
      { usuarioId: objeto("Nacho"), nombre: "Nacho", rol: "organizador" },
      { usuarioId: objeto("Fede"), nombre: "Fede", rol: "miembro" },
      { usuarioId: objeto("Lola"), nombre: "Lola", rol: "lector" },
    ],
    ...extra,
  });
  return viaje.id as string;
}

const nueva = (extra: Record<string, unknown> = {}) => ({ nombre: "Playa", color: "mar", grupal: true, participantes: [idDe("Nacho"), idDe("Fede")], items: ["Protector"], ...extra });

before(async () => {
  const uri = new URL(config.mongoUri);
  uri.pathname = `/${BASE_DE_PRUEBA}`;
  await mongoose.connect(uri.toString());
  assert.equal(mongoose.connection.name, BASE_DE_PRUEBA);
  await mongoose.connection.dropDatabase();
  for (const nombre of ["Nacho", "Fede", "Lola", "Ajena"]) {
    ids[nombre] = (await Usuario.create({ nombre, email: `${nombre.toLowerCase()}@prueba.test` })).id as string;
  }
  servidor = app.listen(0);
  url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

after(async () => {
  servidor.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("una lista grupal guarda nombre, color, participantes e ítems, y conviven varias", async () => {
  const viajeId = await viajeNuevo();
  const { status, cuerpo } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva());
  assert.equal(status, 201);
  assert.equal(cuerpo.nombre, "Playa");
  assert.equal(cuerpo.color, "mar");
  assert.deepEqual(cuerpo.participantes.sort(), [idDe("Nacho"), idDe("Fede")].sort());
  assert.deepEqual(cuerpo.items.map((item) => item.titulo), ["Protector"]);
  await api("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva({ nombre: "Auto", color: "sol" }));
  const todas = await api<Lista[]>("Fede", "GET", `/viajes/${viajeId}/listas`);
  assert.deepEqual(todas.cuerpo.map((lista) => lista.nombre), ["Playa", "Auto"]);
});

test("una lista personal la ve solo quien la creó, aunque mande participantes", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo } = await api<Lista>("Fede", "POST", `/viajes/${viajeId}/listas`, nueva({ grupal: false, nombre: "Mía" }));
  assert.deepEqual(cuerpo.participantes, [idDe("Fede")]);
  assert.equal((await api<Lista[]>("Nacho", "GET", `/viajes/${viajeId}/listas`)).cuerpo.length, 0);
  const ruta = `/viajes/${viajeId}/listas/${cuerpo.id}/items`;
  assert.equal((await api("Nacho", "POST", ruta, { titulo: "Colado" })).status, 404);
});

test("quien no participa no ve una lista grupal, y quien crea entra siempre", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva({ participantes: [idDe("Fede")] }));
  assert.ok(cuerpo.participantes.includes(idDe("Nacho")));
  assert.equal((await api<Lista[]>("Lola", "GET", `/viajes/${viajeId}/listas`)).cuerpo.length, 0);
});

test("alguien de afuera del viaje no puede ser participante, y un lector no crea", async () => {
  const viajeId = await viajeNuevo();
  const ajena = await api<{ error: string }>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva({ participantes: [idDe("Ajena")] }));
  assert.equal(ajena.status, 400);
  assert.equal(ajena.cuerpo.error, "participante-no-es-miembro");
  assert.equal((await api("Lola", "POST", `/viajes/${viajeId}/listas`, nueva())).status, 403);
  assert.equal((await api("Ajena", "GET", `/viajes/${viajeId}/listas`)).status, 404);
  assert.equal((await api("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva({ color: "fucsia" }))).status, 400);
});

test("los ítems se agregan, se tachan y se borran", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo: lista } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva());
  const ruta = `/viajes/${viajeId}/listas/${lista.id}/items`;
  const { cuerpo: conDos } = await api<Lista>("Fede", "POST", ruta, { titulo: "Sombrilla" });
  assert.equal(conDos.items.length, 2);
  const [primero, segundo] = conDos.items as [Lista["items"][number], Lista["items"][number]];
  assert.equal((await api("Fede", "PATCH", `${ruta}/${primero.id}`, { hecha: true })).status, 204);
  assert.equal((await api("Fede", "DELETE", `${ruta}/${segundo.id}`)).status, 204);
  const { cuerpo: [guardada] } = await api<Lista[]>("Nacho", "GET", `/viajes/${viajeId}/listas`);
  assert.deepEqual(guardada?.items.map((item) => [item.titulo, item.hecha]), [["Protector", true]]);
});

test("borra una lista quien la creó o quien organiza, no otro participante", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo: deFede } = await api<Lista>("Fede", "POST", `/viajes/${viajeId}/listas`, nueva());
  const { cuerpo: deNacho } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva());
  assert.equal((await api("Fede", "DELETE", `/viajes/${viajeId}/listas/${deNacho.id}`)).status, 403);
  assert.equal((await api("Nacho", "DELETE", `/viajes/${viajeId}/listas/${deFede.id}`)).status, 204);
  assert.equal((await api("Nacho", "DELETE", `/viajes/${viajeId}/listas/${deNacho.id}`)).status, 204);
});

test("un participante edita nombre, color y personas, sin perder ítems ni a quien la creó", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo: lista } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva({ participantes: [idDe("Fede")] }));
  const cambios = { nombre: "Montaña", color: "bosque", grupal: true, participantes: [idDe("Fede")] };
  const { status, cuerpo } = await api<Lista>("Fede", "PATCH", `/viajes/${viajeId}/listas/${lista.id}`, cambios);
  assert.equal(status, 200);
  assert.equal(cuerpo.nombre, "Montaña");
  assert.equal(cuerpo.color, "bosque");
  assert.deepEqual(cuerpo.items.map((item) => item.titulo), ["Protector"]);
  assert.deepEqual(cuerpo.participantes.sort(), [idDe("Nacho"), idDe("Fede")].sort());
});

test("una persona nueva entra a una lista grupal editándola", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo: lista } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva());
  await Viaje.updateOne({ _id: viajeId }, { $push: { miembros: { usuarioId: objeto("Ajena"), nombre: "Ajena", rol: "miembro" } } });
  assert.equal((await api<Lista[]>("Ajena", "GET", `/viajes/${viajeId}/listas`)).cuerpo.length, 0);
  await api("Fede", "PATCH", `/viajes/${viajeId}/listas/${lista.id}`, { nombre: "Playa", color: "mar", grupal: true, participantes: [idDe("Fede"), idDe("Ajena")] });
  assert.equal((await api<Lista[]>("Ajena", "GET", `/viajes/${viajeId}/listas`)).cuerpo.length, 1);
});

test("volverla personal solo puede quien la creó, y editar no llega a quien no participa", async () => {
  const viajeId = await viajeNuevo();
  const { cuerpo: lista } = await api<Lista>("Nacho", "POST", `/viajes/${viajeId}/listas`, nueva());
  const ruta = `/viajes/${viajeId}/listas/${lista.id}`;
  const cambios = { nombre: "Playa", color: "mar", grupal: false, participantes: [] };
  assert.equal((await api("Fede", "PATCH", ruta, cambios)).status, 403);
  assert.equal((await api("Lola", "PATCH", ruta, cambios)).status, 403);
  const { cuerpo } = await api<Lista>("Nacho", "PATCH", ruta, cambios);
  assert.deepEqual(cuerpo.participantes, [idDe("Nacho")]);
  assert.equal((await api("Fede", "PATCH", ruta, { ...cambios, grupal: true })).status, 404);
});

test("las tareas de antes pasan a listas sin perderse ni duplicarse", async () => {
  const tarea = (titulo: string, lista: string, creadaPor: string, hecha = false) => ({ id: crypto.randomUUID(), titulo, lista, creadaPor: objeto(creadaPor), hecha });
  const viajeId = await viajeNuevo({
    tareas: [tarea("Reservar", "compartida", "Nacho", true), tarea("Carpa", "compartida", "Fede"), tarea("Medias", "personal", "Fede")],
  });
  const [uno, dos] = await Promise.all([
    api<Lista[]>("Fede", "GET", `/viajes/${viajeId}/listas`),
    api<Lista[]>("Nacho", "GET", `/viajes/${viajeId}/listas`),
  ]);
  assert.deepEqual(uno.cuerpo.map((lista) => lista.nombre).sort(), ["Del grupo", "Mi lista"]);
  assert.deepEqual(dos.cuerpo.map((lista) => lista.nombre), ["Del grupo"]);
  const delGrupo = dos.cuerpo[0];
  assert.deepEqual(delGrupo?.items.map((item) => [item.titulo, item.hecha]), [["Reservar", true], ["Carpa", false]]);
  const guardado = await Viaje.findById(viajeId);
  assert.equal(guardado?.tareas.length, 0);
  assert.equal(guardado?.listas.length, 2);
  const { cuerpo: resumen } = await api<{ checklist: { hechas: number; total: number } }>("Fede", "GET", `/viajes/${viajeId}/resumen`);
  assert.deepEqual(resumen.checklist, { hechas: 1, total: 3 });
});
