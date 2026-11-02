import mongoose from "mongoose";
import { app } from "./app.js";
import { config } from "./config.js";

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
