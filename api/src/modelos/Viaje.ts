import mongoose, { type InferSchemaType } from "mongoose";
import { PINZ_IDS } from "./Usuario.js";

const miembroSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre: { type: String, required: true },
    pinz: { type: String, enum: [...PINZ_IDS, null], default: null },
    rol: { type: String, enum: ["organizador", "miembro", "lector"], required: true },
  },
  { _id: false },
);

const viajeSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    destino: { type: String, required: true, trim: true },
    fechaIda: { type: String, default: null },
    fechaVuelta: { type: String, default: null },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    miembros: { type: [miembroSchema], default: [] },
  },
  { timestamps: true },
);

export type DocViaje = mongoose.HydratedDocument<InferSchemaType<typeof viajeSchema>>;

export const Viaje = mongoose.model("Viaje", viajeSchema);
