import assert from "node:assert/strict";
import { test } from "node:test";
import { armarCalendario, plegar } from "./ics.js";

const LINK = "https://pinz.app/viajes/abc/agenda";
const AHORA = new Date("2026-11-05T15:00:00Z");

function calendario(itinerario: Parameters<typeof armarCalendario>[0]["itinerario"], nombre = "Bariloche") {
  return armarCalendario({ id: "abc", nombre, itinerario }, LINK, AHORA);
}

/** Despliega las líneas plegadas: así se leen las propiedades enteras. */
function propiedades(ics: string) {
  return ics.replace(/\r\n /g, "").split("\r\n");
}

test("usa CRLF y ninguna línea pasa los 75 octetos", () => {
  const ics = calendario([
    { id: "1", fecha: "2026-11-05", hora: "09:00", titulo: "Ñandúes 🐦 ".repeat(20), lugar: "Cerro Catedral, Río Negro; Argentina" },
  ]);
  assert.ok(ics.endsWith("\r\n"));
  assert.ok(!/[^\r]\n/.test(ics), "hay un \\n sin \\r");
  for (const linea of ics.split("\r\n")) assert.ok(Buffer.byteLength(linea, "utf8") <= 75, `línea de ${Buffer.byteLength(linea, "utf8")} octetos`);
  assert.ok(propiedades(ics).includes(`SUMMARY:${"Ñandúes 🐦 ".repeat(20)}`));
});

test("plegar no corta un carácter de varios bytes", () => {
  const linea = `SUMMARY:${"ñ".repeat(100)}`;
  const partes = plegar(linea).split("\r\n");
  assert.ok(partes.length > 1);
  assert.equal(partes.map((parte, i) => (i === 0 ? parte : parte.slice(1))).join(""), linea);
  for (const parte of partes) assert.ok(!parte.includes("�"));
});

test("DTEND usa horaFin o, sin ella, una hora después", () => {
  const lineas = propiedades(calendario([
    { id: "1", fecha: "2026-11-05", hora: "09:00", horaFin: "11:30", titulo: "Trekking" },
    { id: "2", fecha: "2026-11-05", hora: "23:30", horaFin: null, titulo: "Cena" },
  ]));
  assert.ok(lineas.includes("DTSTART:20261105T090000"));
  assert.ok(lineas.includes("DTEND:20261105T113000"));
  // Sin horaFin pasa la medianoche: termina al día siguiente.
  assert.ok(lineas.includes("DTSTART:20261105T233000"));
  assert.ok(lineas.includes("DTEND:20261106T003000"));
});

test("lleva nombre, refresco, UID estable, link y escapa el texto", () => {
  const lineas = propiedades(calendario([{ id: "act-1", fecha: "2026-11-05", hora: "09:00", titulo: "Café, medialunas; y\nmás", lugar: null }], "Sur; 2026"));
  assert.ok(lineas.includes("X-WR-CALNAME:Sur\\; 2026"));
  assert.ok(lineas.includes("REFRESH-INTERVAL;VALUE=DURATION:PT1H"));
  assert.ok(lineas.includes("X-PUBLISHED-TTL:PT1H"));
  assert.ok(lineas.includes("UID:act-1@pinz"));
  assert.ok(lineas.includes("DTSTAMP:20261105T150000Z"));
  assert.ok(lineas.includes("SUMMARY:Café\\, medialunas\\; y\\nmás"));
  assert.ok(lineas.includes(`DESCRIPTION:Sur\\; 2026 en Pinz: ${LINK}`));
  assert.ok(!lineas.some((linea) => linea.startsWith("LOCATION:")));
});

test("con zona, las horas van en UTC según el destino", () => {
  const lineas = propiedades(calendario([
    // Bariloche: UTC-3 todo el año.
    { id: "1", fecha: "2026-11-05", hora: "10:00", horaFin: "12:00", titulo: "Trekking", zona: "America/Argentina/Buenos_Aires" },
    // Madrid en julio: horario de verano, UTC+2. Sin horaFin pasa la medianoche local.
    { id: "2", fecha: "2027-07-10", hora: "23:30", titulo: "Cena", zona: "Europe/Madrid" },
    // Madrid en enero: UTC+1.
    { id: "3", fecha: "2027-01-10", hora: "09:00", titulo: "Museo", zona: "Europe/Madrid" },
  ]));
  assert.ok(lineas.includes("DTSTART:20261105T130000Z"));
  assert.ok(lineas.includes("DTEND:20261105T150000Z"));
  assert.ok(lineas.includes("DTSTART:20270710T213000Z"));
  assert.ok(lineas.includes("DTEND:20270710T223000Z"));
  assert.ok(lineas.includes("DTSTART:20270110T080000Z"));
});

test("el día que cambia el horario de verano usa el desfase de esa hora", () => {
  // Madrid adelanta el reloj el 28/3/2027 a las 02:00: a las 10:00 ya es UTC+2.
  const lineas = propiedades(calendario([{ id: "1", fecha: "2027-03-28", hora: "10:00", titulo: "Paseo", zona: "Europe/Madrid" }]));
  assert.ok(lineas.includes("DTSTART:20270328T080000Z"));
});

test("sin zona, o con una que no existe, la hora queda flotante", () => {
  const lineas = propiedades(calendario([
    { id: "1", fecha: "2026-11-05", hora: "10:00", titulo: "A", zona: null },
    { id: "2", fecha: "2026-11-06", hora: "10:00", titulo: "B", zona: "Marte/Olympus_Mons" },
  ]));
  assert.ok(lineas.includes("DTSTART:20261105T100000"));
  assert.ok(lineas.includes("DTSTART:20261106T100000"));
});
