import mongoose from "mongoose";

type UbicacionCompartidaData = {
  viajeId: mongoose.Types.ObjectId;
  usuarioId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  expiraEn: Date;
};

const ubicacionCompartidaSchema = new mongoose.Schema<UbicacionCompartidaData>(
  {
    viajeId: { type: mongoose.Schema.Types.ObjectId, ref: "Viaje", required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    expiraEn: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

ubicacionCompartidaSchema.index({ viajeId: 1, usuarioId: 1 }, { unique: true });

export const UbicacionCompartida = mongoose.model<UbicacionCompartidaData>(
  "UbicacionCompartida",
  ubicacionCompartidaSchema,
);
