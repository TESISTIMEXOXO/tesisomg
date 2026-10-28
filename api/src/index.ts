import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import { rutasAuth } from "./rutas/auth.js";
import { rutasPerfil } from "./rutas/perfil.js";
import { rutasViajes } from "./rutas/viajes.js";

const app = express();
// credentials: el front manda la cookie de sesión en cada pedido.
app.use(cors({ origin: config.webUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", rutasAuth);
app.use("/perfil", rutasPerfil);
app.use("/viajes", rutasViajes);

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Mongo conectado");
    app.listen(config.puerto, () => console.log(`API en puerto ${config.puerto}`));
  })
  .catch((err) => {
    console.error("No se pudo conectar a Mongo", err);
    process.exit(1);
  });
