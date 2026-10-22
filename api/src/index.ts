import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("Mongo conectado");
    app.listen(port, () => console.log(`API en puerto ${port}`));
  })
  .catch((err) => {
    console.error("No se pudo conectar a Mongo", err);
    process.exit(1);
  });