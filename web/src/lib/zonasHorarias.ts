/*
 * La zona horaria de un destino, sin librerías ni servicios: con el país (que resuelve /lugares/pais)
 * y, en los países con más de una zona, la ciudad de referencia más cercana dentro de ese país.
 * Cubre los países de lib/paises.ts. Cerca de un límite entre zonas puede errar; fuera de la tabla, null.
 */

/** Zona IANA y la ciudad que la representa (lat, lng). */
type Ancla = readonly [zona: string, lat: number, lng: number]

const UNA_ZONA: Record<string, string> = {
  AR: 'America/Argentina/Buenos_Aires',
  UY: 'America/Montevideo',
  PY: 'America/Asuncion',
  BO: 'America/La_Paz',
  PE: 'America/Lima',
  CO: 'America/Bogota',
  VE: 'America/Caracas',
  CU: 'America/Havana',
  DO: 'America/Santo_Domingo',
  PA: 'America/Panama',
  CR: 'America/Costa_Rica',
  GT: 'America/Guatemala',
  SV: 'America/El_Salvador',
  HN: 'America/Tegucigalpa',
  NI: 'America/Managua',
  BZ: 'America/Belize',
  JM: 'America/Jamaica',
  BS: 'America/Nassau',
  IT: 'Europe/Rome',
  FR: 'Europe/Paris',
  GB: 'Europe/London',
  DE: 'Europe/Berlin',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Zurich',
  GR: 'Europe/Athens',
  IE: 'Europe/Dublin',
  AT: 'Europe/Vienna',
  BE: 'Europe/Brussels',
  DK: 'Europe/Copenhagen',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  FI: 'Europe/Helsinki',
  IS: 'Atlantic/Reykjavik',
  LU: 'Europe/Luxembourg',
  MT: 'Europe/Malta',
  CY: 'Asia/Nicosia',
  AD: 'Europe/Andorra',
  PL: 'Europe/Warsaw',
  CZ: 'Europe/Prague',
  SK: 'Europe/Bratislava',
  HU: 'Europe/Budapest',
  SI: 'Europe/Ljubljana',
  HR: 'Europe/Zagreb',
  RO: 'Europe/Bucharest',
  BG: 'Europe/Sofia',
  EE: 'Europe/Tallinn',
  LV: 'Europe/Riga',
  LT: 'Europe/Vilnius',
  RS: 'Europe/Belgrade',
  AL: 'Europe/Tirane',
  ME: 'Europe/Podgorica',
  BA: 'Europe/Sarajevo',
  MK: 'Europe/Skopje',
  TR: 'Europe/Istanbul',
  UA: 'Europe/Kyiv',
  JP: 'Asia/Tokyo',
  TH: 'Asia/Bangkok',
  IL: 'Asia/Jerusalem',
  AE: 'Asia/Dubai',
  CN: 'Asia/Shanghai',
  NZ: 'Pacific/Auckland',
  MA: 'Africa/Casablanca',
  EG: 'Africa/Cairo',
  ZA: 'Africa/Johannesburg',
  KE: 'Africa/Nairobi',
  TZ: 'Africa/Dar_es_Salaam',
  TN: 'Africa/Tunis',
  SA: 'Asia/Riyadh',
  QA: 'Asia/Qatar',
  JO: 'Asia/Amman',
  IN: 'Asia/Kolkata',
  VN: 'Asia/Ho_Chi_Minh',
  MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
  PH: 'Asia/Manila',
  KR: 'Asia/Seoul',
  KH: 'Asia/Phnom_Penh',
  LK: 'Asia/Colombo',
  NP: 'Asia/Kathmandu',
}

/* Varias ciudades por zona donde el límite pasa cerca de destinos turísticos (Atlanta es del este, Nashville del centro). */
const VARIAS_ZONAS: Record<string, readonly Ancla[]> = {
  US: [
    ['America/New_York', 40.71, -74.01],
    ['America/New_York', 42.36, -71.06],
    ['America/New_York', 38.91, -77.04],
    ['America/New_York', 25.76, -80.19],
    ['America/New_York', 28.54, -81.38],
    ['America/New_York', 33.75, -84.39],
    ['America/Detroit', 42.33, -83.05],
    ['America/Indiana/Indianapolis', 39.77, -86.16],
    ['America/Chicago', 41.88, -87.63],
    ['America/Chicago', 36.16, -86.78],
    ['America/Chicago', 29.95, -90.07],
    ['America/Chicago', 32.78, -96.8],
    ['America/Chicago', 29.76, -95.37],
    ['America/Chicago', 44.98, -93.27],
    ['America/Denver', 39.74, -104.99],
    ['America/Denver', 40.76, -111.89],
    ['America/Denver', 35.08, -106.65],
    ['America/Phoenix', 33.45, -112.07],
    ['America/Phoenix', 36.05, -112.14],
    ['America/Los_Angeles', 34.05, -118.24],
    ['America/Los_Angeles', 37.77, -122.42],
    ['America/Los_Angeles', 47.61, -122.33],
    ['America/Los_Angeles', 36.17, -115.14],
    ['America/Los_Angeles', 45.52, -122.68],
    ['America/Anchorage', 61.22, -149.9],
    ['Pacific/Honolulu', 21.31, -157.86],
  ],
  CA: [
    ['America/Toronto', 43.65, -79.38],
    ['America/Toronto', 45.5, -73.57],
    ['America/Toronto', 46.81, -71.21],
    ['America/Toronto', 45.42, -75.7],
    ['America/Halifax', 44.65, -63.57],
    ['America/St_Johns', 47.56, -52.71],
    ['America/Winnipeg', 49.9, -97.14],
    ['America/Regina', 50.45, -104.61],
    ['America/Edmonton', 51.05, -114.07],
    ['America/Edmonton', 53.55, -113.49],
    ['America/Edmonton', 51.18, -115.57],
    ['America/Vancouver', 49.28, -123.12],
    ['America/Vancouver', 50.12, -122.95],
    ['America/Whitehorse', 60.72, -135.06],
  ],
  MX: [
    ['America/Mexico_City', 19.43, -99.13],
    ['America/Mexico_City', 20.67, -103.35],
    ['America/Mexico_City', 17.07, -96.73],
    ['America/Mexico_City', 16.85, -99.88],
    ['America/Monterrey', 25.67, -100.31],
    ['America/Merida', 20.97, -89.62],
    ['America/Cancun', 21.16, -86.85],
    ['America/Cancun', 20.63, -87.07],
    ['America/Cancun', 20.21, -87.47],
    ['America/Chihuahua', 28.63, -106.07],
    ['America/Mazatlan', 23.25, -106.41],
    ['America/Mazatlan', 24.14, -110.31],
    ['America/Mazatlan', 22.89, -109.92],
    ['America/Hermosillo', 29.07, -110.96],
    ['America/Tijuana', 32.51, -117.04],
  ],
  BR: [
    ['America/Sao_Paulo', -23.55, -46.63],
    ['America/Sao_Paulo', -22.91, -43.17],
    ['America/Sao_Paulo', -15.79, -47.88],
    ['America/Sao_Paulo', -25.43, -49.27],
    ['America/Sao_Paulo', -25.52, -54.59],
    ['America/Sao_Paulo', -27.6, -48.55],
    ['America/Sao_Paulo', -30.03, -51.23],
    ['America/Sao_Paulo', -19.92, -43.94],
    ['America/Bahia', -12.97, -38.5],
    ['America/Recife', -8.05, -34.88],
    ['America/Fortaleza', -3.73, -38.52],
    ['America/Belem', -1.46, -48.5],
    ['America/Noronha', -3.85, -32.42],
    ['America/Manaus', -3.12, -60.02],
    ['America/Campo_Grande', -20.44, -54.65],
    ['America/Cuiaba', -15.6, -56.1],
    ['America/Porto_Velho', -8.76, -63.9],
    ['America/Rio_Branco', -9.97, -67.81],
  ],
  CL: [
    ['America/Santiago', -33.45, -70.67],
    ['America/Santiago', -41.47, -72.94],
    ['America/Santiago', -23.65, -70.4],
    ['America/Punta_Arenas', -53.16, -70.91],
    ['Pacific/Easter', -27.12, -109.35],
  ],
  EC: [
    ['America/Guayaquil', -2.19, -79.89],
    ['America/Guayaquil', -0.18, -78.47],
    ['Pacific/Galapagos', -0.74, -90.31],
  ],
  ES: [
    ['Europe/Madrid', 40.42, -3.7],
    ['Europe/Madrid', 41.39, 2.17],
    ['Europe/Madrid', 37.39, -5.98],
    ['Europe/Madrid', 39.57, 2.65],
    ['Atlantic/Canary', 28.12, -15.43],
    ['Atlantic/Canary', 28.46, -16.25],
  ],
  PT: [
    ['Europe/Lisbon', 38.72, -9.14],
    ['Europe/Lisbon', 41.15, -8.61],
    ['Atlantic/Madeira', 32.65, -16.91],
    ['Atlantic/Azores', 37.74, -25.67],
  ],
  AU: [
    ['Australia/Sydney', -33.87, 151.21],
    ['Australia/Sydney', -35.28, 149.13],
    ['Australia/Melbourne', -37.81, 144.96],
    ['Australia/Brisbane', -27.47, 153.03],
    ['Australia/Brisbane', -16.92, 145.77],
    ['Australia/Adelaide', -34.93, 138.6],
    ['Australia/Perth', -31.95, 115.86],
    ['Australia/Darwin', -12.46, 130.84],
    ['Australia/Hobart', -42.88, 147.33],
  ],
  RU: [
    ['Europe/Kaliningrad', 54.71, 20.51],
    ['Europe/Moscow', 55.76, 37.62],
    ['Europe/Moscow', 59.94, 30.31],
    ['Europe/Moscow', 43.6, 39.73],
    ['Asia/Yekaterinburg', 56.84, 60.6],
    ['Asia/Novosibirsk', 55.03, 82.92],
    ['Asia/Irkutsk', 52.29, 104.3],
    ['Asia/Vladivostok', 43.12, 131.89],
  ],
  ID: [
    ['Asia/Jakarta', -6.2, 106.85],
    ['Asia/Jakarta', -7.8, 110.36],
    ['Asia/Makassar', -8.65, 115.22],
    ['Asia/Makassar', -5.14, 119.42],
    ['Asia/Jayapura', -2.53, 140.72],
  ],
}

/** La zona IANA del destino, o null si su país no está en la tabla. */
export function zonaHoraria(codigoPais: string | null, lat: number, lng: number): string | null {
  if (!codigoPais) return null
  const unica = UNA_ZONA[codigoPais]
  if (unica) return unica
  const anclas = VARIAS_ZONAS[codigoPais]
  if (!anclas) return null
  /* Un grado de longitud se achica lejos del ecuador: sin esto, en el norte las ciudades al este y oeste parecen más lejos. */
  const escala = Math.cos((lat * Math.PI) / 180)
  let mejor = anclas[0]
  let menor = Infinity
  for (const ancla of anclas) {
    const distancia = (ancla[1] - lat) ** 2 + ((ancla[2] - lng) * escala) ** 2
    if (distancia < menor) {
      menor = distancia
      mejor = ancla
    }
  }
  return mejor[0]
}

/** El día y la hora que marca el reloj en esa zona, como AAAA-MM-DDTHH:MM. Sin zona, los del dispositivo. */
export function relojEn(zona: string | null, ahora: Date) {
  const partes = Object.fromEntries(formato(zona).formatToParts(ahora).map((parte) => [parte.type, parte.value]))
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`
}

const OPCIONES: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }

/* Un navegador viejo puede no conocer una zona renombrada (Europe/Kyiv): ahí vale la hora del dispositivo. */
function formato(zona: string | null) {
  try {
    return new Intl.DateTimeFormat('en-CA', { ...OPCIONES, timeZone: zona ?? undefined })
  } catch {
    return new Intl.DateTimeFormat('en-CA', OPCIONES)
  }
}
