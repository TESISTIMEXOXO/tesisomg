/*
 * Datos de ejemplo de todo el frontend, en un solo lugar.
 * Los servicios los devuelven mientras no haya backend; cuando lo haya, este archivo se borra.
 */
import type { Documento } from '../types/documento'
import type { Gasto } from '../types/gasto'
import type { InvitacionGrupo, Movimiento } from '../types/grupo'
import type { Hoy, ItemItinerario } from '../types/itinerario'
import type { Perfil } from '../types/perfil'
import type { Persona } from '../types/persona'
import type { Saldos } from '../types/saldo'
import type { Requisito, Tarea } from '../types/tarea'
import type { Emergencias, Invitacion, ResumenViaje, Viaje } from '../types/viaje'
import type { Votacion } from '../types/votacion'

/** Espera un poco antes de responder, para que se vean los estados de carga. */
export function demora(ms = 350) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

/**
 * Las operaciones que escriben todavía no tienen dónde guardar: esperan como si fueran
 * al backend, muestran en consola lo que mandarían y no cambian ningún dato.
 */
export async function sinBackend(operacion: string, datos: unknown) {
  await demora()
  console.info(`[sin backend] ${operacion}`, datos)
}

const nacho: Persona = { id: 'nacho', nombre: 'Nacho', pinz: 'vuelto', rol: 'miembro', esVos: true }
const fede: Persona = { id: 'fede', nombre: 'Fede', pinz: 'brujula', rol: 'organizador', esVos: false }
const santi: Persona = { id: 'santi', nombre: 'Santi', pinz: 'siesta', rol: 'miembro', esVos: false }
const juanCruz: Persona = { id: 'juan-cruz', nombre: 'Juan Cruz', pinz: 'trasnoche', rol: 'miembro', esVos: false }
const pedro: Persona = { id: 'pedro', nombre: 'Pedro', pinz: 'morfi', rol: 'miembro', esVos: false }
const tomi: Persona = { id: 'tomi', nombre: 'Tomi', pinz: 'cumbre', rol: 'lector', esVos: false }

const BARILOCHE = 'bariloche-con-los-chicos'
const MAR_DE_LAS_PAMPAS = 'mar-de-las-pampas'

export const viajes: Viaje[] = [
  {
    id: BARILOCHE,
    nombre: 'Bariloche con los chicos',
    destino: 'Bariloche',
    fechaIda: '2027-01-14',
    fechaVuelta: '2027-01-21',
    personas: [nacho, fede, santi, juanCruz, pedro, tomi],
    pendiente: 'Falta tu voto: alojamiento',
    estadoCuentas: null,
  },
  {
    id: MAR_DE_LAS_PAMPAS,
    nombre: 'Verano en Mar de las Pampas',
    destino: 'Mar de las Pampas',
    fechaIda: '2026-02-07',
    fechaVuelta: '2026-02-14',
    personas: [nacho, fede, santi, pedro],
    pendiente: null,
    estadoCuentas: 'todos a mano',
  },
]

export const resumenes: ResumenViaje[] = [
  {
    viajeId: BARILOCHE,
    pendientes: ['Votá dónde dormimos: cierra el viernes', 'Sacar el seguro de viaje está a tu nombre'],
    checklist: { hechas: 12, total: 20 },
  },
  { viajeId: MAR_DE_LAS_PAMPAS, pendientes: [], checklist: { hechas: 14, total: 14 } },
]

export const votaciones: Votacion[] = [
  {
    id: 'alojamiento',
    viajeId: BARILOCHE,
    pregunta: '¿Dónde dormimos?',
    categoria: 'alojamiento',
    estado: 'abierta',
    cierre: 'Cierra el viernes',
    opciones: [
      { id: 'coihues', nombre: 'Cabaña Los Coihues', detalle: '$ 38.000 la noche', votantes: ['fede', 'tomi', 'pedro'] },
      { id: 'hostel', nombre: 'Hostel del Lago', detalle: '$ 22.000 la noche', votantes: ['juan-cruz'] },
      { id: 'melipal', nombre: 'Depto. en Melipal', detalle: '$ 31.000 la noche', votantes: [] },
    ],
    votoPropio: null,
    ganadoraId: null,
    faltan: ['nacho', 'santi'],
  },
  {
    id: 'primera-cena',
    viajeId: BARILOCHE,
    pregunta: '¿Dónde comemos la primera noche?',
    categoria: 'comida',
    estado: 'abierta',
    cierre: 'Cierra el domingo',
    opciones: [
      { id: 'trucha', nombre: 'Trucha en el puerto', detalle: 'A 10 minutos de la cabaña', votantes: ['nacho', 'pedro'] },
      { id: 'parrilla', nombre: 'Parrilla del centro', detalle: 'Hay que reservar', votantes: ['fede'] },
    ],
    votoPropio: 'trucha',
    ganadoraId: null,
    faltan: ['santi', 'juan-cruz', 'tomi'],
  },
  {
    id: 'fechas',
    viajeId: BARILOCHE,
    pregunta: '¿Cuándo salimos?',
    categoria: 'fechas',
    estado: 'cerrada',
    cierre: null,
    opciones: [
      { id: 'enero', nombre: '14 al 21 de enero', detalle: null, votantes: ['nacho', 'fede', 'santi', 'pedro', 'tomi'] },
      { id: 'febrero', nombre: '4 al 11 de febrero', detalle: null, votantes: ['juan-cruz'] },
    ],
    votoPropio: 'enero',
    ganadoraId: 'enero',
    faltan: [],
  },
]

export const itinerario: ItemItinerario[] = [
  { id: 'i1', viajeId: BARILOCHE, fecha: '2027-01-14', hora: '07:30', titulo: 'Salida en micro', lugar: 'Terminal de Retiro', estado: 'pendiente' },
  { id: 'i2', viajeId: BARILOCHE, fecha: '2027-01-14', hora: '21:00', titulo: 'Llegada a la cabaña', lugar: 'Cabaña Los Coihues', estado: 'pendiente' },
  { id: 'i3', viajeId: BARILOCHE, fecha: '2027-01-15', hora: '09:40', titulo: 'Salida a la aerosilla', lugar: 'Base Cerro Otto', estado: 'pendiente' },
  { id: 'i4', viajeId: BARILOCHE, fecha: '2027-01-15', hora: '13:30', titulo: 'Almuerzo en el refugio', lugar: 'Refugio Lynch', estado: 'pendiente' },
  { id: 'i5', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '08:30', titulo: 'Desayuno en la cabaña', lugar: 'Cabaña Los Coihues', estado: 'pendiente' },
  { id: 'i6', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '10:00', titulo: 'Subida al Cerro Catedral', lugar: 'Base del cerro', estado: 'pendiente' },
  { id: 'i7', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '14:00', titulo: 'Almuerzo en el refugio', lugar: 'Refugio Lynch', estado: 'pendiente' },
]

export const hoy: Hoy = {
  viajeId: BARILOCHE,
  fecha: '2027-01-16',
  dia: 3,
  totalDias: 8,
  titulo: 'a la montaña',
  items: [
    { id: 'i5', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '08:30', titulo: 'Desayuno en la cabaña', lugar: 'Cabaña Los Coihues', estado: 'hecho' },
    { id: 'i6', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '10:00', titulo: 'Subida al Cerro Catedral', lugar: 'Base del cerro', estado: 'ahora' },
    { id: 'i7', viajeId: BARILOCHE, fecha: '2027-01-16', hora: '14:00', titulo: 'Almuerzo en el refugio', lugar: 'Refugio Lynch', estado: 'pendiente' },
  ],
  puntos: [
    { id: 'cabana', nombre: 'Cabaña Los Coihues', lat: -41.08, lng: -71.52, tipo: 'alojamiento' },
    { id: 'catedral', nombre: 'Base del cerro', lat: -41.17, lng: -71.44, tipo: 'actividad' },
    { id: 'refugio', nombre: 'Refugio Lynch', lat: -41.16, lng: -71.47, tipo: 'comida' },
  ],
  ubicaciones: [
    { id: 'fede', nombre: 'Fede', pinz: 'brujula', lat: -41.17, lng: -71.44 },
    { id: 'santi', nombre: 'Santi', pinz: 'siesta', lat: -41.17, lng: -71.44 },
    { id: 'pedro', nombre: 'Pedro', pinz: 'morfi', lat: -41.17, lng: -71.44 },
    { id: 'tomi', nombre: 'Tomi', pinz: 'cumbre', lat: -41.17, lng: -71.44 },
    { id: 'nacho', nombre: 'Nacho', pinz: 'vuelto', lat: -41.17, lng: -71.44 },
    { id: 'juan-cruz', nombre: 'Juan Cruz', pinz: 'trasnoche', lat: -41.12, lng: -71.48 },
  ],
  aviso: null,
}

export const gastos: Gasto[] = [
  { id: 'g1', viajeId: BARILOCHE, descripcion: 'Seña de la cabaña', monto: 120000, pagoId: 'fede', fecha: '2026-10-12', division: 'iguales' },
  { id: 'g2', viajeId: BARILOCHE, descripcion: 'Seguro de viaje del grupo', monto: 54000, pagoId: 'tomi', fecha: '2026-10-18', division: 'iguales' },
  { id: 'g3', viajeId: BARILOCHE, descripcion: 'Pasajes en micro', monto: 186000, pagoId: 'pedro', fecha: '2026-10-20', division: 'iguales' },
]

export const saldos: Saldos[] = [
  {
    viajeId: BARILOCHE,
    moneda: 'ARS',
    saldos: [
      { persona: { id: 'fede', nombre: 'Fede', pinz: 'brujula' }, monto: -12400 },
      { persona: { id: 'juan-cruz', nombre: 'Juan Cruz', pinz: 'trasnoche' }, monto: 3100 },
      { persona: { id: 'tomi', nombre: 'Tomi', pinz: 'cumbre' }, monto: 8300 },
      { persona: { id: 'santi', nombre: 'Santi', pinz: 'siesta' }, monto: 0 },
      { persona: { id: 'pedro', nombre: 'Pedro', pinz: 'morfi' }, monto: 0 },
    ],
  },
  {
    viajeId: MAR_DE_LAS_PAMPAS,
    moneda: 'ARS',
    saldos: [
      { persona: { id: 'fede', nombre: 'Fede', pinz: 'brujula' }, monto: 0 },
      { persona: { id: 'santi', nombre: 'Santi', pinz: 'siesta' }, monto: 0 },
      { persona: { id: 'pedro', nombre: 'Pedro', pinz: 'morfi' }, monto: 0 },
    ],
  },
]

export const tareas: Tarea[] = [
  { id: 't1', viajeId: BARILOCHE, titulo: 'Sacar el seguro de viaje', lista: 'compartida', responsableId: 'nacho', hecha: false },
  { id: 't2', viajeId: BARILOCHE, titulo: 'Reservar el auto', lista: 'compartida', responsableId: 'santi', hecha: false },
  { id: 't3', viajeId: BARILOCHE, titulo: 'Comprar los pasajes', lista: 'compartida', responsableId: 'pedro', hecha: true },
  { id: 't4', viajeId: BARILOCHE, titulo: 'Señar la cabaña', lista: 'compartida', responsableId: 'fede', hecha: true },
  { id: 't5', viajeId: BARILOCHE, titulo: 'Llevar campera de abrigo', lista: 'personal', responsableId: 'nacho', hecha: false },
  { id: 't6', viajeId: BARILOCHE, titulo: 'Cargar el power bank', lista: 'personal', responsableId: 'nacho', hecha: true },
]

export const requisitos: Requisito[] = [
  { id: 'r1', viajeId: BARILOCHE, titulo: 'DNI vigente', detalle: 'Para viajar dentro del país alcanza con el DNI.', cumplido: true },
  { id: 'r2', viajeId: BARILOCHE, titulo: 'Seguro de viaje', detalle: 'Lo saca el grupo; falta que lo confirmes.', cumplido: false },
  { id: 'r3', viajeId: BARILOCHE, titulo: 'Pasaje de ida', detalle: 'Micro desde Retiro, 14 de enero.', cumplido: true },
]

export const documentos: Documento[] = [
  { id: 'd1', viajeId: BARILOCHE, nombre: 'Pasajes de ida y vuelta.pdf', tipo: 'pasaje', tamano: 245000, personal: false, vence: null },
  { id: 'd2', viajeId: BARILOCHE, nombre: 'Voucher cabaña.pdf', tipo: 'voucher', tamano: 180000, personal: false, vence: null },
  { id: 'd3', viajeId: null, nombre: 'DNI.jpg', tipo: 'identidad', tamano: 820000, personal: true, vence: '2031-05-10' },
  { id: 'd4', viajeId: null, nombre: 'Pasaporte.jpg', tipo: 'identidad', tamano: 910000, personal: true, vence: '2027-03-02' },
]

export const emergencias: Emergencias[] = [
  {
    viajeId: BARILOCHE,
    contactos: [
      { id: 'e1', nombre: 'Emergencias', detalle: 'Policía y emergencias en todo el país', telefono: '911' },
      { id: 'e2', nombre: 'Emergencias médicas', detalle: 'SAME y ambulancias', telefono: '107' },
      { id: 'e3', nombre: 'Bomberos', detalle: 'Incendios y rescate', telefono: '100' },
      { id: 'e4', nombre: 'Asistencia del seguro', detalle: 'Se completa cuando el grupo saque el seguro', telefono: null },
    ],
    alojamiento: { nombre: 'Cabaña Los Coihues', direccion: 'Av. Bustillo km 18, Bariloche', direccionLocal: null },
  },
]

export const invitacionesGrupo: InvitacionGrupo[] = [
  { viajeId: BARILOCHE, codigo: 'BRL427', link: 'https://pinz.app/unirse/BRL427' },
  { viajeId: MAR_DE_LAS_PAMPAS, codigo: 'MDP208', link: 'https://pinz.app/unirse/MDP208' },
]

export const movimientos: Movimiento[] = [
  { id: 'm1', viajeId: BARILOCHE, texto: 'Juan Cruz votó Hostel del Lago', cuando: 'hace 2 h' },
  { id: 'm2', viajeId: BARILOCHE, texto: 'Pedro pagó los pasajes en micro', cuando: 'hace 6 días' },
  { id: 'm3', viajeId: BARILOCHE, texto: 'Tomi se sumó al viaje', cuando: 'hace 2 semanas' },
]

export const invitacion: Invitacion = {
  codigo: 'BRL427',
  invitaNombre: 'Fede',
  viaje: {
    id: BARILOCHE,
    nombre: 'Bariloche con los chicos',
    destino: 'Bariloche',
    fechaIda: '2027-01-14',
    fechaVuelta: '2027-01-21',
    personas: [fede, santi, juanCruz, pedro, tomi],
  },
  yaEsMiembro: false,
}

export const perfil: Perfil = {
  id: 'nacho',
  nombre: 'Nacho',
  pinz: 'vuelto',
  moneda: 'ARS',
  preferencias: { presupuestoPorNoche: 40000, ritmo: 'intermedio', comida: 'Como de todo', alergias: null },
  aeropuertos: ['Aeroparque (AEP)', 'Ezeiza (EZE)'],
  historial: [{ viajeId: MAR_DE_LAS_PAMPAS, destino: 'Mar de las Pampas', fecha: '2026-02-07' }],
}
