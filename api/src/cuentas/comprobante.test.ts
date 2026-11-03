import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { config } from "../config.js";
import { lector } from "./comprobante.js";

// El SDK real contra un servidor de mentira: prueba el pedido que sale y cómo se lee la respuesta, sin gastar llamadas.
let servidor: Server;
let pedido: {
  model: string;
  messages: [{ content: [{ type: string; source: { media_type: string } }] }];
  output_config: { format: { type: string; schema: { properties: { fecha: { description: string }; moneda: { description: string } } } } };
};
let respuesta: { texto: string; stop_reason: string };

before(async () => {
  servidor = createServer((req, res) => {
    let cuerpo = "";
    req.on("data", (parte) => (cuerpo += parte));
    req.on("end", () => {
      pedido = JSON.parse(cuerpo) as typeof pedido;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        id: "msg_prueba",
        type: "message",
        role: "assistant",
        model: pedido.model,
        content: [{ type: "text", text: respuesta.texto }],
        stop_reason: respuesta.stop_reason,
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }));
    });
  });
  await new Promise<void>((listo) => servidor.listen(0, "127.0.0.1", listo));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  (config as { anthropicApiKey: string }).anthropicApiKey = "clave-de-prueba";
});

after(() => {
  delete process.env.ANTHROPIC_BASE_URL;
  servidor.close();
});

const lectura = { legible: true, descripcion: "Café Tortoni", monto: 18500, fecha: "2026-10-12", moneda: null };

test("una foto sale como imagen con el esquema descripto y vuelve parseada", async () => {
  respuesta = { texto: JSON.stringify(lectura), stop_reason: "end_turn" };
  const leida = await lector.leer({ contenido: Buffer.from("foto"), tipo: "image/jpeg" });
  assert.deepEqual(leida, lectura);
  assert.equal(pedido.messages[0].content[0].type, "image");
  assert.equal(pedido.messages[0].content[0].source.media_type, "image/jpeg");
  assert.equal(pedido.output_config.format.type, "json_schema");
  assert.match(pedido.output_config.format.schema.properties.fecha.description, /YYYY-MM-DD/);
  assert.match(pedido.output_config.format.schema.properties.moneda.description, /ISO/);
});

test("un PDF sale como documento", async () => {
  respuesta = { texto: JSON.stringify(lectura), stop_reason: "end_turn" };
  await lector.leer({ contenido: Buffer.from("%PDF"), tipo: "application/pdf" });
  assert.equal(pedido.messages[0].content[0].type, "document");
});

test("una negativa del modelo queda como ilegible", async () => {
  respuesta = { texto: "", stop_reason: "refusal" };
  const leida = await lector.leer({ contenido: Buffer.from("foto"), tipo: "image/png" });
  assert.equal(leida.legible, false);
});
