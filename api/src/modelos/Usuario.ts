import mongoose, { type InferSchemaType } from "mongoose";

export const PINZ_IDS = ["chispa", "brujula", "vuelto", "siesta", "valija", "postal", "nono", "trasnoche", "morfi", "cumbre"] as const;
export const MONEDAS = ["ARS", "USD", "UYU", "CLP", "BRL"] as const;

const usuarioSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Vacío hasta que completa la bienvenida. */
    nombre: { type: String, default: "" },
    pinz: { type: String, enum: [...PINZ_IDS, null], default: null },
    moneda: { type: String, enum: MONEDAS, default: "ARS" },
    tema: { type: String, enum: ["claro", "oscuro", "sistema"], default: "claro" },
    /** "sal:hash" de scrypt. null si sólo entra con Google. */
    contrasenaHash: { type: String, default: null },
    /** El id de la cuenta en cada proveedor con el que ya entró. */
    proveedores: {
      google: { type: String, default: null },
    },
    preferencias: {
      presupuestoPorNoche: { type: Number, default: null },
      ritmo: { type: String, enum: ["tranqui", "intermedio", "a full", null], default: null },
      comida: { type: String, default: null },
      alergias: { type: String, default: null },
    },
    aeropuertos: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type DocUsuario = mongoose.HydratedDocument<InferSchemaType<typeof usuarioSchema>>;

export const Usuario = mongoose.model("Usuario", usuarioSchema);

/** Busca por email y, si no existe, lo crea. Si viene de un proveedor, le anota el id de la cuenta. */
export async function usuarioPorEmail(email: string, proveedor?: { nombre: "google"; id: string }, nombre?: string) {
  const cambios: Record<string, string> = {};
  if (proveedor) cambios[`proveedores.${proveedor.nombre}`] = proveedor.id;
  const usuario = await Usuario.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: cambios, $setOnInsert: { nombre: nombre?.trim() ?? "" } },
    { upsert: true, new: true },
  );
  return usuario;
}

/** Lo que el front ve de su propia cuenta. */
export function usuarioPublico(usuario: DocUsuario) {
  return {
    id: usuario.id as string,
    email: usuario.email,
    nombre: usuario.nombre,
    pinz: usuario.pinz ?? null,
    moneda: usuario.moneda,
    /** Recién creado o sin nombre: el front lo manda a la bienvenida. */
    perfilCompleto: usuario.nombre.length > 0,
  };
}
