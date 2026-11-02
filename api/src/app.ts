import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config.js";
import { rutasAuth } from "./rutas/auth.js";
import { rutasContacto } from "./rutas/contacto.js";
import { rutasArchivo, rutasDocumentosPersonales, rutasDocumentosViaje } from "./rutas/documentos.js";
import { rutasGastos } from "./rutas/gastos.js";
import { rutasItinerario } from "./rutas/itinerario.js";
import { rutasLugares } from "./rutas/lugares.js";
import { rutasPerfil } from "./rutas/perfil.js";
import { rutasTareas } from "./rutas/tareas.js";
import { rutasViajes } from "./rutas/viajes.js";
import { rutasVotaciones } from "./rutas/votaciones.js";
import { requiereSesion } from "./auth/sesion.js";

/** La app sin levantar el servidor, para que las pruebas la usen sola. */
export const app = express();
// credentials: el front manda la cookie de sesión en cada pedido.
app.use(cors({ origin: config.webUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", rutasAuth);
app.use("/contacto", rutasContacto);
app.use("/perfil", rutasPerfil);
app.use("/lugares", requiereSesion, rutasLugares);
app.use("/documentos-personales", requiereSesion, rutasDocumentosPersonales);
app.use("/documentos", requiereSesion, rutasArchivo);
app.use("/viajes/:id/documentos", requiereSesion, rutasDocumentosViaje);
app.use("/viajes/:id/votaciones", requiereSesion, rutasVotaciones);
app.use("/viajes/:id/itinerario", requiereSesion, rutasItinerario);
app.use("/viajes/:id/tareas", requiereSesion, rutasTareas);
app.use("/viajes/:id/gastos", requiereSesion, rutasGastos);
app.use("/viajes", rutasViajes);
