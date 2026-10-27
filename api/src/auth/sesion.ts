import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

export const COOKIE_SESION = "pinz_sesion";
const DURACION_SEGUNDOS = 30 * 24 * 60 * 60;
const clave = new TextEncoder().encode(config.sesionSecreto);

/** Firma la sesión y la deja en una cookie que el JS del front no puede leer. */
export async function abrirSesion(res: Response, usuarioId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEGUNDOS}s`)
    .sign(clave);
  res.cookie(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.produccion,
    maxAge: DURACION_SEGUNDOS * 1000,
    path: "/",
  });
}

export function cerrarSesion(res: Response) {
  res.clearCookie(COOKIE_SESION, { httpOnly: true, sameSite: "lax", secure: config.produccion, path: "/" });
}

/** El id del usuario de la sesión, o null si no hay sesión válida. */
export async function usuarioDeLaSesion(req: Request) {
  const token: unknown = req.cookies?.[COOKIE_SESION];
  if (typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token, clave, { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Corta con 401 si no hay sesión; si la hay, deja el id en res.locals.usuarioId. */
export async function requiereSesion(req: Request, res: Response, next: NextFunction) {
  const usuarioId = await usuarioDeLaSesion(req);
  if (!usuarioId) {
    res.status(401).json({ error: "sin-sesion" });
    return;
  }
  res.locals.usuarioId = usuarioId;
  next();
}
