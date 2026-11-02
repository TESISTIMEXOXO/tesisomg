import mongoose from "mongoose";
import { app } from "./app.js";
import { config } from "./config.js";

async function iniciar() {
  while (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
    } catch (error) {
      console.error("No se pudo conectar a Mongo; se reintentará en 5 segundos", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  console.log("Mongo conectado");
  app.listen(config.puerto, () => console.log(`API en puerto ${config.puerto}`));
}

void iniciar();
