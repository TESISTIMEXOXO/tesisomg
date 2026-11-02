import mongoose from "mongoose";
import { config } from "../config.js";
import { migrarCuentas } from "./migracion.js";

/** Se corre una vez por base: docker compose exec api npm run migrar:cuentas */
await mongoose.connect(config.mongoUri);
const viajes = await migrarCuentas();
console.log(`Viajes revisados: ${viajes}`);
await mongoose.disconnect();
