import mongoose from "mongoose";

const documentoSchema = new mongoose.Schema(
  {
    viajeId: { type: mongoose.Schema.Types.ObjectId, ref: "Viaje", default: null, index: true },
    propietarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ["pasaje", "voucher", "seguro", "identidad", "otro"], required: true },
    tamano: { type: Number, required: true },
    contentType: { type: String, required: true },
    contenido: { type: Buffer, required: true },
    vence: { type: String, default: null },
  },
  { timestamps: true },
);

export const Documento = mongoose.model("Documento", documentoSchema);
