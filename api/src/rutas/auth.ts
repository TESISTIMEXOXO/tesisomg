import { Router, type Response } from "express";
import { z } from "zod";
import { ContrasenaSchema, contrasenaCoincide, hashearContrasena } from "../auth/contrasena.js";
import { mandarCodigo, verificarCodigo, type ResultadoVerificacion } from "../auth/mail.js";
import { googleConfigurado, identidadDesdeCodigo } from "../auth/oauth.js";
import { abrirSesion, cerrarSesion, requiereSesion } from "../auth/sesion.js";
import { Usuario, usuarioPorEmail, usuarioPublico } from "../modelos/Usuario.js";

export const rutasAuth = Router();

const RegistroSchema = z.object({ email: z.email(), contrasena: ContrasenaSchema });
const VerificacionSchema = z.object({ email: z.email(), codigo: z.string().regex(/^\d{6}$/) });
const IngresoSchema = z.object({ email: z.email(), contrasena: z.string().min(1).max(128) });
const GoogleSchema = z.object({ code: z.string().min(1) });
const PedidoRecuperarSchema = z.object({ email: z.email() });
const RecuperarSchema = z.object({ email: z.email(), codigo: z.string().regex(/^\d{6}$/), contrasena: ContrasenaSchema });

/** Responde el rechazo de un código: vencido, sin intentos o incorrecto (con los intentos que quedan). */
function rechazarCodigo(res: Response, resultado: Extract<ResultadoVerificacion, { ok: false }>) {
  const { ok: _ok, motivo, ...resto } = resultado;
  res.status(400).json({ error: motivo, ...resto });
}

/* ---------- Crear cuenta con mail y contraseña ---------- */

/** Paso 1: guarda la contraseña elegida y manda un código al mail. Pedirlo de nuevo reemplaza el código anterior. */
rutasAuth.post("/registro", async (req, res) => {
  const pedido = RegistroSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const existente = await Usuario.exists({ email: pedido.data.email.toLowerCase(), contrasenaHash: { $ne: null } });
  if (existente) {
    res.status(409).json({ error: "ya-registrado" });
    return;
  }
  await mandarCodigo(pedido.data.email, "registro", await hashearContrasena(pedido.data.contrasena));
  res.status(204).end();
});

/** Paso 2: con el código correcto se crea la cuenta (o se le suma la contraseña a una que entró con Google). */
rutasAuth.post("/registro/verificar", async (req, res) => {
  const pedido = VerificacionSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "codigo-invalido" });
    return;
  }
  const resultado = await verificarCodigo(pedido.data.email, "registro", pedido.data.codigo);
  if (!resultado.ok) {
    rechazarCodigo(res, resultado);
    return;
  }
  const usuario = await usuarioPorEmail(resultado.email);
  usuario.contrasenaHash = resultado.contrasenaHash;
  await usuario.save();
  await abrirSesion(res, usuario.id);
  res.json(usuarioPublico(usuario));
});

/* ---------- Entrar con mail y contraseña ---------- */

rutasAuth.post("/ingresar", async (req, res) => {
  const pedido = IngresoSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  // Sin tope de intentos: a cada error se le dice qué pasó para que pueda corregirlo o cambiar la contraseña.
  const usuario = await Usuario.findOne({ email: pedido.data.email.toLowerCase() });
  if (!usuario) {
    res.status(401).json({ error: "sin-cuenta" });
    return;
  }
  if (!usuario.contrasenaHash) {
    res.status(401).json({ error: "sin-contrasena" });
    return;
  }
  if (!(await contrasenaCoincide(pedido.data.contrasena, usuario.contrasenaHash))) {
    res.status(401).json({ error: "contrasena-incorrecta" });
    return;
  }
  await abrirSesion(res, usuario.id);
  res.json(usuarioPublico(usuario));
});

/* ---------- Olvidé mi contraseña ---------- */

/** Paso 1: manda un código al mail de una cuenta que ya existe. */
rutasAuth.post("/recuperar", async (req, res) => {
  const pedido = PedidoRecuperarSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  if (!(await Usuario.exists({ email: pedido.data.email.toLowerCase() }))) {
    res.status(404).json({ error: "sin-cuenta" });
    return;
  }
  await mandarCodigo(pedido.data.email, "recuperar");
  res.status(204).end();
});

/** Paso 2: código y contraseña nueva juntos. Con el código correcto se cambia la contraseña y se abre la sesión. */
rutasAuth.post("/recuperar/verificar", async (req, res) => {
  // La contraseña se valida antes que el código, así una contraseña inválida no gasta un intento.
  const pedido = RecuperarSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const resultado = await verificarCodigo(pedido.data.email, "recuperar", pedido.data.codigo);
  if (!resultado.ok) {
    rechazarCodigo(res, resultado);
    return;
  }
  const usuario = await Usuario.findOneAndUpdate(
    { email: resultado.email },
    { $set: { contrasenaHash: await hashearContrasena(pedido.data.contrasena) } },
    { new: true },
  );
  if (!usuario) {
    res.status(404).json({ error: "sin-cuenta" });
    return;
  }
  await abrirSesion(res, usuario.id);
  res.json(usuarioPublico(usuario));
});

/* ---------- Google ---------- */

rutasAuth.post("/google", async (req, res) => {
  if (!googleConfigurado()) {
    res.status(503).json({ error: "proveedor-no-disponible" });
    return;
  }
  const pedido = GoogleSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  try {
    const identidad = await identidadDesdeCodigo(pedido.data.code);
    const usuario = await usuarioPorEmail(identidad.email, { nombre: "google", id: identidad.id }, identidad.nombre);
    await abrirSesion(res, usuario.id);
    res.json(usuarioPublico(usuario));
  } catch (error) {
    console.error("Falló el ingreso con Google", error);
    res.status(401).json({ error: "google-rechazado" });
  }
});

/* ---------- Sesión ---------- */

rutasAuth.get("/yo", requiereSesion, async (_req, res) => {
  const usuario = await Usuario.findById(res.locals.usuarioId);
  if (!usuario) {
    cerrarSesion(res);
    res.status(401).json({ error: "sin-sesion" });
    return;
  }
  res.json(usuarioPublico(usuario));
});

rutasAuth.post("/salir", (_req, res) => {
  cerrarSesion(res);
  res.status(204).end();
});
