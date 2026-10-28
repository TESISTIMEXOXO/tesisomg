import mongoose from "mongoose";

/**
 * Lo que manda alguien desde "Escribinos" en la landing. No hace falta tener cuenta.
 * Se leen desde Compass o mongosh, en la colección "consultas".
 */
const consultaSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    asunto: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    /** Para el tope de consultas por hora desde una misma conexión. */
    ip: { type: String, default: null },
    /** false si falló el mail de confirmación (la consulta igual queda guardada). */
    confirmacionEnviada: { type: Boolean, default: false },
    /** false si falló el aviso al equipo (CONTACTO_EQUIPO). */
    avisoEnviado: { type: Boolean, default: false },
  },
  { timestamps: true },
);
consultaSchema.index({ email: 1, createdAt: -1 });
consultaSchema.index({ ip: 1, createdAt: -1 });

export const Consulta = mongoose.model("Consulta", consultaSchema);
