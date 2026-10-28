import mongoose from "mongoose";

export const PROPOSITOS = ["registro", "recuperar"] as const;
export type Proposito = (typeof PROPOSITOS)[number];

/**
 * Códigos de 6 dígitos mandados por mail: para confirmar una cuenta nueva o para cambiar la contraseña.
 * Uno por email y propósito a la vez (pedir otro reemplaza al anterior). Se guarda el hash, se cuentan
 * los intentos y Mongo los borra al vencer. En el registro también se guarda la contraseña elegida
 * hasta que se confirme.
 */
const codigoVerificacionSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  proposito: { type: String, enum: PROPOSITOS, required: true },
  codigoHash: { type: String, required: true },
  contrasenaHash: { type: String, default: null },
  intentos: { type: Number, default: 0 },
  venceEn: { type: Date, required: true, expires: 0 },
});
codigoVerificacionSchema.index({ email: 1, proposito: 1 }, { unique: true });

export const CodigoVerificacion = mongoose.model("CodigoVerificacion", codigoVerificacionSchema);
