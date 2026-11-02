import mongoose from "mongoose";
import { MONEDAS, PINZ_IDS } from "./Usuario.js";

type RolViaje = "organizador" | "miembro" | "lector";
type CategoriaVotacion = "destino" | "fechas" | "alojamiento" | "actividad" | "comida";
type TipoDivision = "iguales" | "consumo";
type ListaTarea = "compartida" | "personal";

type UbicacionDoc = { nombre: string; lat: number; lng: number };
type MiembroDoc = { usuarioId: mongoose.Types.ObjectId; nombre: string; pinz: (typeof PINZ_IDS)[number] | null; rol: RolViaje };
type OpcionDoc = { id: string; nombre: string; detalle: string | null; votantes: mongoose.Types.ObjectId[] };
type VotacionDoc = { id: string; pregunta: string; categoria: CategoriaVotacion; estado: "abierta" | "cerrada"; cierre: string | null; opciones: OpcionDoc[]; ganadoraId: string | null };
type ActividadDoc = { id: string; fecha: string; hora: string; titulo: string; lugar: string | null; lat: number | null; lng: number | null; hecha: boolean };
type ParteDoc = { personaId: mongoose.Types.ObjectId; monto: number };
type GastoDoc = { id: string; descripcion: string; monto: number; pagoId: mongoose.Types.ObjectId; fecha: string; division: TipoDivision; participantes: mongoose.Types.ObjectId[]; partes: ParteDoc[]; consumos: ParteDoc[]; propina: number; propinaPorcentaje: number; creadoPorId: mongoose.Types.ObjectId | null };
type PagoDoc = { id: string; deudorId: mongoose.Types.ObjectId; acreedorId: mongoose.Types.ObjectId; monto: number; fecha: string; estado: "pendiente" | "confirmado" | "rechazado"; resueltoEn: Date | null };
type TareaDoc = { id: string; titulo: string; lista: ListaTarea; responsableId: mongoose.Types.ObjectId | null; creadaPor: mongoose.Types.ObjectId; hecha: boolean };
type RequisitoDoc = { id: string; titulo: string; detalle: string; cumplidoPor: mongoose.Types.ObjectId[] };
type MovimientoDoc = { id: string; texto: string; creadoEn: Date };
type ContactoEmergenciaDoc = { id: string; nombre: string; detalle: string; telefono: string | null };
type EmergenciasDoc = {
  contactos: ContactoEmergenciaDoc[];
  alojamiento: { nombre: string; direccion: string; direccionLocal: string | null };
};

export type ViajeData = {
  nombre: string;
  destino: string;
  fechaIda: string | null;
  fechaVuelta: string | null;
  ubicacion: UbicacionDoc | null;
  creadoPor: mongoose.Types.ObjectId;
  miembros: MiembroDoc[];
  moneda: (typeof MONEDAS)[number];
  cuentasSimplificadas: boolean;
  codigoInvitacion: string;
  votaciones: VotacionDoc[];
  itinerario: ActividadDoc[];
  gastos: GastoDoc[];
  pagos: PagoDoc[];
  tareas: TareaDoc[];
  requisitos: RequisitoDoc[];
  movimientos: MovimientoDoc[];
  emergencias: EmergenciasDoc;
};

const ubicacionSchema = new mongoose.Schema<UbicacionDoc>(
  {
    nombre: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const miembroSchema = new mongoose.Schema<MiembroDoc>(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre: { type: String, required: true },
    pinz: { type: String, enum: [...PINZ_IDS, null], default: null },
    rol: { type: String, enum: ["organizador", "miembro", "lector"], required: true },
  },
  { _id: false },
);

const opcionSchema = new mongoose.Schema<OpcionDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    nombre: { type: String, required: true },
    detalle: { type: String, default: null },
    votantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  },
  { _id: false },
);

const votacionSchema = new mongoose.Schema<VotacionDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    pregunta: { type: String, required: true },
    categoria: { type: String, enum: ["destino", "fechas", "alojamiento", "actividad", "comida"], required: true },
    estado: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
    cierre: { type: String, default: null },
    opciones: { type: [opcionSchema], default: [] },
    ganadoraId: { type: String, default: null },
  },
  { _id: false },
);

const actividadSchema = new mongoose.Schema<ActividadDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    fecha: { type: String, required: true },
    hora: { type: String, required: true },
    titulo: { type: String, required: true },
    lugar: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    hecha: { type: Boolean, default: false },
  },
  { _id: false },
);

const parteSchema = new mongoose.Schema<ParteDoc>(
  {
    personaId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    monto: { type: Number, required: true },
  },
  { _id: false },
);

const gastoSchema = new mongoose.Schema<GastoDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    pagoId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    fecha: { type: String, required: true },
    division: { type: String, enum: ["iguales", "consumo"], required: true },
    participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
    partes: { type: [parteSchema], default: [] },
    // Lo que consumió cada uno antes de la propina: hace falta para volver a editar el gasto.
    consumos: { type: [parteSchema], default: [] },
    propina: { type: Number, default: 0 },
    propinaPorcentaje: { type: Number, default: 0 },
    creadoPorId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
  },
  { _id: false },
);

const pagoSchema = new mongoose.Schema<PagoDoc>(
  {
    id: { type: String, required: true, default: () => crypto.randomUUID() },
    deudorId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    acreedorId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    monto: { type: Number, required: true },
    fecha: { type: String, required: true },
    // Los pagos guardados antes de que hubiera confirmación ya contaban: quedan confirmados.
    estado: { type: String, enum: ["pendiente", "confirmado", "rechazado"], default: "confirmado" },
    resueltoEn: { type: Date, default: null },
  },
  { _id: false },
);

const tareaSchema = new mongoose.Schema<TareaDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    titulo: { type: String, required: true },
    lista: { type: String, enum: ["compartida", "personal"], required: true },
    responsableId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    hecha: { type: Boolean, default: false },
  },
  { _id: false },
);

const requisitoSchema = new mongoose.Schema<RequisitoDoc>(
  {
    id: { type: String, required: true },
    titulo: { type: String, required: true },
    detalle: { type: String, required: true },
    cumplidoPor: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  },
  { _id: false },
);

const movimientoSchema = new mongoose.Schema<MovimientoDoc>(
  {
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    texto: { type: String, required: true },
    creadoEn: { type: Date, default: Date.now },
  },
  { _id: false },
);

const viajeSchema = new mongoose.Schema<ViajeData>(
  {
    nombre: { type: String, required: true, trim: true },
    destino: { type: String, required: true, trim: true },
    fechaIda: { type: String, default: null },
    fechaVuelta: { type: String, default: null },
    ubicacion: { type: ubicacionSchema, default: null },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    miembros: { type: [miembroSchema], default: [] },
    moneda: { type: String, enum: MONEDAS, default: "ARS" },
    cuentasSimplificadas: { type: Boolean, default: false },
    codigoInvitacion: { type: String, required: true, unique: true, index: true },
    votaciones: { type: [votacionSchema], default: [] },
    itinerario: { type: [actividadSchema], default: [] },
    gastos: { type: [gastoSchema], default: [] },
    pagos: { type: [pagoSchema], default: [] },
    tareas: { type: [tareaSchema], default: [] },
    requisitos: { type: [requisitoSchema], default: [] },
    movimientos: { type: [movimientoSchema], default: [] },
    emergencias: {
      contactos: [{
        id: { type: String, required: true },
        nombre: { type: String, required: true },
        detalle: { type: String, required: true },
        telefono: { type: String, default: null },
      }],
      alojamiento: {
        nombre: { type: String, default: "" },
        direccion: { type: String, default: "" },
        direccionLocal: { type: String, default: null },
      },
    },
  },
  { timestamps: true },
);

export type DocViaje = mongoose.HydratedDocument<ViajeData>;

export const Viaje = mongoose.model<ViajeData>("Viaje", viajeSchema);
