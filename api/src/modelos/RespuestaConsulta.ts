import mongoose from "mongoose";

/**
 * Lo que el superadmin le contestó por mail a una consulta de "Escribinos".
 * Copia el mail, el asunto y la descripción: si la consulta se borra, la respuesta sigue diciendo a qué contestó.
 */
type RespuestaConsultaData = {
  consultaId: mongoose.Types.ObjectId;
  email: string;
  asunto: string;
  descripcion: string;
  texto: string;
  createdAt: Date;
};

const respuestaConsultaSchema = new mongoose.Schema<RespuestaConsultaData>(
  {
    consultaId: { type: mongoose.Schema.Types.ObjectId, ref: "Consulta", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    asunto: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    texto: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
respuestaConsultaSchema.index({ createdAt: -1 });

export const RespuestaConsulta = mongoose.model<RespuestaConsultaData>("RespuestaConsulta", respuestaConsultaSchema);
