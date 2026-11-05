/**
 * El itinerario de un viaje como calendario iCalendar (RFC 5545): sirve para bajarlo una vez y para el feed
 * al que se suscriben Google Calendar y el iPhone.
 */

type ActividadIcs = {
  id: string;
  fecha: string;
  hora: string;
  horaFin?: string | null;
  titulo: string;
  lugar?: string | null;
  /** Zona IANA del destino de ese día. Sin ella, la hora va flotante. */
  zona?: string | null;
};

export type ViajeIcs = { id: string; nombre: string; itinerario: ActividadIcs[] };

const CRLF = "\r\n";
const MAX_OCTETOS = 75;

/** Escapa un TEXT de iCalendar: barras, saltos de línea, comas y punto y coma. */
function escapar(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/**
 * Pliega una línea a 75 octetos: las que siguen empiezan con un espacio (que también cuenta). Corta por
 * caracteres enteros, nunca a la mitad de uno de varios bytes como "ñ" o un emoji.
 */
export function plegar(linea: string) {
  const partes: string[] = [];
  let actual = "";
  let octetos = 0;
  for (const caracter of linea) {
    const largo = Buffer.byteLength(caracter, "utf8");
    if (octetos + largo > MAX_OCTETOS) {
      partes.push(actual);
      actual = " ";
      octetos = 1;
    }
    actual += caracter;
    octetos += largo;
  }
  partes.push(actual);
  return partes.join(CRLF);
}

/** AAAAMMDDTHHMMSS de un Date leído en UTC. */
function fechaIcs(fecha: Date) {
  return fecha.toISOString().slice(0, 19).replace(/[-:]/g, "");
}

/** Cuántos milisegundos está adelantada la zona respecto de UTC en ese instante (Buenos Aires: -3 h). */
function desfase(zona: string, instante: number) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(instante)).map((parte) => [parte.type, Number(parte.value)]),
  );
  return Date.UTC(partes.year!, partes.month! - 1, partes.day!, partes.hour!, partes.minute!, partes.second!) - instante;
}

/**
 * El instante en que en esa zona el reloj marca esa fecha y hora. Dos pasadas por si en el medio cambia
 * el horario de verano. Una zona que el servidor no conoce devuelve null y la hora queda flotante.
 */
export function aUtc(relojLocal: number, zona: string) {
  try {
    const primera = relojLocal - desfase(zona, relojLocal);
    return relojLocal - desfase(zona, primera);
  } catch {
    return null;
  }
}

/*
 * Con zona, DTSTART y DTEND van en UTC (con Z): cada calendario la ubica bien y la muestra en la hora de
 * quien la mira. Así Google no la corre. Sin zona, quedan flotantes: la hora local tal cual.
 * Las cuentas se hacen sobre la hora local leída como UTC, para sumar sin husos.
 */
function inicioYFin(actividad: ActividadIcs) {
  const inicio = Date.parse(`${actividad.fecha}T${actividad.hora}:00Z`);
  const fin = actividad.horaFin && actividad.horaFin > actividad.hora
    ? Date.parse(`${actividad.fecha}T${actividad.horaFin}:00Z`)
    : inicio + 60 * 60 * 1000;
  const inicioUtc = actividad.zona ? aUtc(inicio, actividad.zona) : null;
  const finUtc = actividad.zona ? aUtc(fin, actividad.zona) : null;
  if (inicioUtc !== null && finUtc !== null) {
    return { inicio: `${fechaIcs(new Date(inicioUtc))}Z`, fin: `${fechaIcs(new Date(finUtc))}Z` };
  }
  return { inicio: fechaIcs(new Date(inicio)), fin: fechaIcs(new Date(fin)) };
}

/** linkViaje: dónde ver el viaje en Pinz, para la descripción de cada evento. */
export function armarCalendario(viaje: ViajeIcs, linkViaje: string, ahora = new Date()) {
  const sello = `${fechaIcs(ahora)}Z`;
  const eventos = [...viaje.itinerario]
    .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))
    .flatMap((actividad) => {
      const { inicio, fin } = inicioYFin(actividad);
      return [
        "BEGIN:VEVENT",
        // Estable: al actualizarse el feed, el calendario reemplaza el evento en vez de duplicarlo.
        `UID:${actividad.id}@pinz`,
        `DTSTAMP:${sello}`,
        `DTSTART:${inicio}`,
        `DTEND:${fin}`,
        `SUMMARY:${escapar(actividad.titulo)}`,
        ...(actividad.lugar ? [`LOCATION:${escapar(actividad.lugar)}`] : []),
        `DESCRIPTION:${escapar(`${viaje.nombre} en Pinz: ${linkViaje}`)}`,
        `URL:${linkViaje}`,
        "END:VEVENT",
      ];
    });
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pinz//Itinerario//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapar(viaje.nombre)}`,
    // Cada cuánto pedir el feed de nuevo. Google lo ignora y actualiza cuando quiere (unas horas).
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...eventos,
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join(CRLF) + CRLF;
}

/** Para el Content-Disposition: el nombre del viaje sin lo que rompe un nombre de archivo. */
export function nombreDeArchivo(nombre: string) {
  return `${nombre.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim() || "itinerario"}.ics`;
}
