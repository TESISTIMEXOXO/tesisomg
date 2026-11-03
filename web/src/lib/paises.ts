// Datos de emergencia por país para viajeros argentinos.
// Fuentes principales: cancilleria.gob.ar/emergencia-consular (guardias), sitios e<xxx>.cancilleria.gob.ar
// (direcciones y teléfonos de embajadas), CDC Travelers' Health y Cancillería (fiebre amarilla),
// listado de números de emergencia por país. Relevado: octubre-noviembre 2026.
//
// Nota 112: en la UE (y en muchos otros países) el 112 funciona desde cualquier celular GSM, aun sin
// saldo; en varios países (AR, BR, CL, DO, CR, TH, IL, JP, AU) se redirige al número local. Igual,
// conviene marcar primero el número local que figura acá.

export type TelefonoEmergencia = { id: string; nombre: string; detalle: string; telefono: string }

export type Embajada = {
  /** Como se escribe en el país, para mostrársela a alguien de ahí. */
  direccion: string
  ciudad: string
  telefono: string | null
  /** El celular de guardia para emergencias fuera de horario, si la embajada lo publica. */
  guardia: string | null
  web: string | null
}

export type InfoPais = {
  /** Código ISO de dos letras, en mayúsculas. */
  codigo: string
  nombre: string
  /** El primero es el número principal, el equivalente al 911. */
  telefonos: TelefonoEmergencia[]
  /** null en Argentina y donde no hay embajada abierta. */
  embajada: Embajada | null
  precauciones: string[]
}

/** Guardia de Cancillería (Buenos Aires) para argentinos en el exterior. Solo voz; WhatsApp: +54 9 11 5061-5903. */
export const GUARDIA_CANCILLERIA = '+54 9 11 5040-7243'
export const HORARIO_GUARDIA_CANCILLERIA = 'de lunes a viernes de 20 a 9 h, y sábados, domingos y feriados las 24 h'

const t = (id: string, nombre: string, detalle: string, telefono: string): TelefonoEmergencia => ({
  id,
  nombre,
  detalle,
  telefono,
})

const UNICO = (num: string, detalle = 'Policía, ambulancia y bomberos') =>
  t('emergencias', 'Emergencias', detalle, num)

const SCHENGEN_SEGURO =
  'Entrás sin visa hasta 90 días (Schengen). Tené seguro médico (mín. €30.000), te lo pueden pedir en migraciones.'
const ETIAS = 'ETIAS todavía no está vigente: chequeá antes de viajar si ya lo piden.'

export const PAISES: Record<string, InfoPais> = {
  AR: {
    codigo: 'AR',
    nombre: 'Argentina',
    telefonos: [
      t('emergencias', 'Emergencias', 'Policía y emergencias generales', '911'),
      t('ambulancia', 'SAME / Ambulancia', 'Emergencias médicas', '107'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '100'),
      t('policia', 'Policía', 'Donde no funcione el 911', '101'),
      t('defensa-civil', 'Defensa Civil', 'Catástrofes y temporales', '103'),
    ],
    embajada: null,
    precauciones: [
      'En el norte (Jujuy, Salta) cuidate de la altura: andá despacio y tomá agua.',
      'En verano hay dengue en varias provincias: usá repelente.',
    ],
  },

  BR: {
    codigo: 'BR',
    nombre: 'Brasil',
    telefonos: [
      t('policia', 'Polícia Militar', 'Emergencias policiales (112 y 911 redirigen acá)', '190'),
      t('ambulancia', 'SAMU', 'Ambulancia', '192'),
      t('bomberos', 'Bombeiros', 'Incendios y rescates', '193'),
    ],
    embajada: {
      direccion: 'Setor de Embaixadas Sul, Quadra 803, Lote 12',
      ciudad: 'Brasília',
      telefono: '+55 61 3212-7600',
      guardia: '+55 61 98165-9280',
      web: 'https://ebras.cancilleria.gob.ar',
    },
    precauciones: [
      'Vacuna de fiebre amarilla recomendada en muchos estados (incl. RJ, SP, MG, BA): al menos 10 días antes.',
      'Dengue: usá repelente siempre, sobre todo en verano.',
      'No tomes agua de la canilla; tomá agua embotellada.',
      'Cuidá el celular en la calle y en la playa: hay muchos robos al paso.',
    ],
  },

  CL: {
    codigo: 'CL',
    nombre: 'Chile',
    telefonos: [
      t('policia', 'Carabineros', 'Emergencias policiales (112 y 911 redirigen acá)', '133'),
      t('ambulancia', 'SAMU', 'Ambulancia', '131'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '132'),
      t('pdi', 'PDI', 'Policía de Investigaciones', '134'),
    ],
    embajada: {
      direccion: 'Miraflores 285, Santiago Centro',
      ciudad: 'Santiago',
      telefono: '+56 2 2582-2500',
      guardia: '+56 9 9333-0101',
      web: 'https://ehile.cancilleria.gob.ar',
    },
    precauciones: [
      'Es zona sísmica: si tiembla fuerte en la costa, alejate del mar y subí a zona alta.',
      'En el norte (San Pedro de Atacama, altiplano) cuidate de la altura.',
      'Ojo con robos de celulares y bolsos en zonas céntricas de Santiago.',
    ],
  },

  UY: {
    codigo: 'UY',
    nombre: 'Uruguay',
    telefonos: [
      UNICO('911'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '104'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas (ASSE)', '105'),
    ],
    embajada: {
      direccion: 'Cuareim 1470',
      ciudad: 'Montevideo',
      telefono: '+598 2902 8166',
      guardia: '+598 92 947 601',
      web: 'https://eurug.cancilleria.gob.ar',
    },
    precauciones: [
      'Llevá asistencia al viajero: la atención médica privada es cara.',
      'En playas, respetá las banderas de los guardavidas.',
    ],
  },

  PY: {
    codigo: 'PY',
    nombre: 'Paraguay',
    telefonos: [
      UNICO('911', 'Policía y emergencias'),
      t('ambulancia', 'Emergencias médicas (SEME)', 'Ambulancia', '141'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '132'),
    ],
    embajada: {
      direccion: 'Av. España 743',
      ciudad: 'Asunción',
      telefono: '+595 21 212-320',
      guardia: '+595 971 266-060',
      web: 'https://epara.cancilleria.gob.ar',
    },
    precauciones: [
      'Vacuna de fiebre amarilla recomendada (salvo si sólo vas a Asunción).',
      'Dengue: usá repelente siempre.',
      'Tomá agua embotellada.',
      'Ciudad del Este: cuidá tus pertenencias y desconfiá de cambistas callejeros.',
    ],
  },

  BO: {
    codigo: 'BO',
    nombre: 'Bolivia',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '110'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '118'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '119'),
    ],
    embajada: {
      direccion: 'Aspiazu 497 esq. Sánchez Lima',
      ciudad: 'La Paz',
      telefono: '+591 2 241-7737',
      guardia: '+591 7202-0998',
      web: 'https://ebolv.cancilleria.gob.ar',
    },
    precauciones: [
      'Mal de altura (La Paz 3.600 m, Uyuni, Potosí): primeros días tranqui, mucha agua y nada de alcohol.',
      'Fiebre amarilla: vacuna recomendada si vas a zonas bajas del este (Santa Cruz, Beni, Pando).',
      'Tomá sólo agua embotellada.',
      'Tomá taxis o radiotaxis pedidos, no en la calle.',
    ],
  },

  PE: {
    codigo: 'PE',
    nombre: 'Perú',
    telefonos: [
      t('policia', 'Policía Nacional', 'Emergencias policiales (911 en prueba en Lima y Callao)', '105'),
      t('ambulancia', 'SAMU', 'Ambulancia', '106'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '116'),
    ],
    embajada: {
      direccion: 'Av. Las Flores 326, San Isidro',
      ciudad: 'Lima',
      telefono: '+51 1 441-4444',
      guardia: '+51 924 170 215',
      web: 'https://eperu.cancilleria.gob.ar',
    },
    precauciones: [
      'Mal de altura en Cusco y Puno: aclimatate un par de días antes de caminatas.',
      'Fiebre amarilla: vacuna recomendada si vas a la selva (Amazonía).',
      'Tomá sólo agua embotellada.',
      'Usá taxis por app o pedidos; evitá taxis informales.',
    ],
  },

  CO: {
    codigo: 'CO',
    nombre: 'Colombia',
    telefonos: [
      UNICO('123', 'Línea única de emergencias'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '125'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '119'),
      t('gaula', 'Antisecuestro (GAULA)', 'Secuestro y extorsión', '165'),
    ],
    embajada: {
      direccion: 'Carrera 11 B No. 97-56, piso 4, Edificio Ápice',
      ciudad: 'Bogotá',
      telefono: '+57 601 288 0900',
      guardia: '+57 316 875 9292',
      web: 'https://ecolo.cancilleria.gob.ar',
    },
    precauciones: [
      'Fiebre amarilla: hay brote activo. Vacunate al menos 10 días antes y llevá el certificado.',
      'No aceptes bebidas de desconocidos (riesgo de escopolamina / "burundanga").',
      'Usá taxis por app; no muestres el celular en la calle.',
      'Bogotá está a 2.600 m: tomalo con calma los primeros días.',
    ],
  },

  EC: {
    codigo: 'EC',
    nombre: 'Ecuador',
    telefonos: [UNICO('911', 'ECU 911: policía, ambulancia y bomberos')],
    embajada: {
      direccion: 'Av. Amazonas N21-147 y Roca, piso 8',
      ciudad: 'Quito',
      telefono: '+593 2 256-2292',
      guardia: '+593 99 973 8957',
      web: 'https://eecua.cancilleria.gob.ar',
    },
    precauciones: [
      'Si llegás desde Colombia, Brasil, Perú o Bolivia te piden certificado de fiebre amarilla.',
      'Fiebre amarilla recomendada si vas a la Amazonía.',
      'Quito está a 2.850 m: cuidate de la altura.',
      'Hay zonas con alta inseguridad (ej. Guayaquil): informate antes y evitá moverte de noche.',
    ],
  },

  VE: {
    codigo: 'VE',
    nombre: 'Venezuela',
    telefonos: [UNICO('911', 'VEN 911: emergencias (también 171)')],
    embajada: null,
    precauciones: [
      'Argentina NO tiene embajada abierta en Venezuela: ante una emergencia, llamá a la guardia de Cancillería.',
      'Revisá las alertas de Cancillería antes de viajar.',
      'Fiebre amarilla recomendada (salvo Caracas y zonas altas). Hay malaria en zonas bajas.',
      'Tomá sólo agua embotellada.',
    ],
  },

  MX: {
    codigo: 'MX',
    nombre: 'México',
    telefonos: [UNICO('911'), t('denuncia', 'Denuncia anónima', 'Denuncias', '089')],
    embajada: {
      direccion: 'Av. Paseo de las Palmas 1685, Col. Lomas de Chapultepec, Miguel Hidalgo',
      ciudad: 'Ciudad de México',
      telefono: '+52 55 5520-9430',
      guardia: '+52 55 4603-2654',
      web: 'https://emexi.cancilleria.gob.ar',
    },
    precauciones: [
      'No tomes agua de la canilla.',
      'Dengue: usá repelente en zonas costeras.',
      'Ojo con estafas de taxis y cajeros; usá apps o sitios oficiales.',
      'CDMX está a 2.240 m: puede costar al principio.',
    ],
  },

  CU: {
    codigo: 'CU',
    nombre: 'Cuba',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '106'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '104'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '105'),
    ],
    embajada: {
      direccion: 'Calle 36 No. 511, Miramar, Playa',
      ciudad: 'La Habana',
      telefono: '+53 7 204-2110',
      guardia: '+53 5 286-8055',
      web: 'https://ecuba.cancilleria.gob.ar',
    },
    precauciones: [
      'Seguro médico de viaje OBLIGATORIO para entrar. Necesitás también visa/tarjeta de turista.',
      'Hay cortes de luz y faltan medicamentos: llevá tu botiquín.',
      'Dengue y chikungunya: usá repelente.',
      'Llevá efectivo: muchas tarjetas no funcionan.',
    ],
  },

  DO: {
    codigo: 'DO',
    nombre: 'República Dominicana',
    telefonos: [UNICO('911')],
    embajada: {
      direccion: 'Av. Máximo Gómez No. 10, Gazcue',
      ciudad: 'Santo Domingo',
      telefono: '+1 809 682-0976',
      guardia: '+1 809 399-3817',
      web: 'https://edomi.cancilleria.gob.ar',
    },
    precauciones: [
      'Completá el e-Ticket (formulario online) antes de entrar y de salir.',
      'No tomes agua de la canilla.',
      'Dengue: usá repelente.',
    ],
  },

  PA: {
    codigo: 'PA',
    nombre: 'Panamá',
    telefonos: [
      UNICO('911'),
      t('policia', 'Policía', 'Policía Nacional', '104'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '103'),
    ],
    embajada: {
      direccion: 'Calle 50, Edificio Global Bank, piso 24',
      ciudad: 'Panamá',
      telefono: '+507 302-0003',
      guardia: '+507 6616-1112',
      web: 'https://epnma.cancilleria.gob.ar',
    },
    precauciones: [
      'Fiebre amarilla recomendada sólo si vas al este del Canal (Darién, Guna Yala). No hace falta para Ciudad de Panamá.',
      'Malaria en Darién y zonas rurales: consultá antes de viajar.',
      'Dengue: usá repelente.',
    ],
  },

  CR: {
    codigo: 'CR',
    nombre: 'Costa Rica',
    telefonos: [UNICO('911')],
    embajada: {
      direccion: 'Curridabat, de Plaza del Sol 700 m sur y 25 m este, 4ta casa a la izquierda',
      ciudad: 'San José',
      telefono: '+506 2234-6270',
      guardia: '+506 8704-1479',
      web: 'https://erica.cancilleria.gob.ar',
    },
    precauciones: [
      'Dengue: usá repelente.',
      'Corrientes fuertes en playas del Pacífico: nadá sólo donde haya guardavidas.',
      'No dejes nada a la vista en el auto.',
    ],
  },

  US: {
    codigo: 'US',
    nombre: 'Estados Unidos',
    telefonos: [UNICO('911')],
    embajada: {
      direccion: '1600 New Hampshire Ave. NW',
      ciudad: 'Washington D.C.',
      telefono: '+1 202 238-6400',
      guardia: '+1 202 294-2029',
      web: 'https://eeeuu.cancilleria.gob.ar',
    },
    precauciones: [
      'Necesitás visa (B1/B2). Argentina todavía no está en el Visa Waiver: no sirve el ESTA.',
      'La atención médica es carísima: viajá con asistencia al viajero de alta cobertura.',
      'Hay consulados argentinos en NY, Miami, LA, Houston, Chicago y Atlanta: buscá el más cercano.',
    ],
  },

  CA: {
    codigo: 'CA',
    nombre: 'Canadá',
    telefonos: [UNICO('911')],
    embajada: {
      direccion: '81 Metcalfe Street, 7th Floor',
      ciudad: 'Ottawa',
      telefono: '+1 613 236-2351',
      guardia: '+1 613 618-4819',
      web: 'https://ecana.cancilleria.gob.ar',
    },
    precauciones: [
      'Si tenés visa de EE.UU. vigente (o visa canadiense de los últimos 10 años) y llegás en avión, alcanza con eTA. Si no, necesitás visa.',
      'La atención médica es cara: viajá con asistencia al viajero.',
      'En invierno, frío extremo: abrigo adecuado.',
    ],
  },

  ES: {
    codigo: 'ES',
    nombre: 'España',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía Nacional', 'Denuncias y emergencias policiales', '091'),
      t('ambulancia', 'Urgencias sanitarias', 'Ambulancia', '061'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '080'),
    ],
    embajada: {
      direccion: 'Calle Fernando el Santo 15, 1º',
      ciudad: 'Madrid',
      telefono: '+34 91 771 0500',
      guardia: '+34 639 70 75 64',
      web: 'https://eespa.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas en metro y zonas turísticas (Madrid, Barcelona).',
      'En verano hay olas de calor: hidratate y evitá el sol del mediodía.',
    ],
  },

  IT: {
    codigo: 'IT',
    nombre: 'Italia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Polizia', 'Policía', '113'),
      t('ambulancia', 'Ambulanza', 'Emergencias médicas', '118'),
      t('bomberos', 'Vigili del Fuoco', 'Bomberos', '115'),
    ],
    embajada: {
      direccion: "Piazza dell'Esquilino 2",
      ciudad: 'Roma',
      telefono: '+39 06 4807 3300',
      guardia: '+39 335 387 607',
      web: 'https://eital.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas en trenes, metro y sitios turísticos.',
      'Validá el boleto de tren/bus antes de subir: las multas son altas.',
    ],
  },

  FR: {
    codigo: 'FR',
    nombre: 'Francia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('ambulancia', 'SAMU', 'Emergencias médicas', '15'),
      t('policia', 'Police', 'Policía', '17'),
      t('bomberos', 'Pompiers', 'Bomberos', '18'),
    ],
    embajada: {
      direccion: '6, rue Cimarosa, 75116',
      ciudad: 'París',
      telefono: '+33 1 44 05 27 00',
      guardia: '+33 6 01 88 09 98',
      web: 'https://efran.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas y estafas (pulseras, firmas) en zonas turísticas de París.',
    ],
  },

  GB: {
    codigo: 'GB',
    nombre: 'Reino Unido',
    telefonos: [
      UNICO('999', 'Policía, ambulancia y bomberos (también 112)'),
      t('salud', 'NHS 111', 'Consultas médicas no urgentes', '111'),
      t('policia', 'Policía (no urgente)', 'Denuncias no urgentes', '101'),
    ],
    embajada: {
      direccion: '65 Brook Street',
      ciudad: 'Londres',
      telefono: '+44 20 7318 1300',
      guardia: '+44 7793 654075',
      web: 'https://eruni.cancilleria.gob.ar',
    },
    precauciones: [
      'Necesitás ETA (autorización electrónica) antes de viajar, aunque no pidas visa.',
      'Los autos vienen por la izquierda: mirá a la derecha antes de cruzar.',
      'Viajá con asistencia al viajero: el NHS puede cobrarte la atención.',
    ],
  },

  DE: {
    codigo: 'DE',
    nombre: 'Alemania',
    telefonos: [
      UNICO('112', 'Ambulancia y bomberos'),
      t('policia', 'Polizei', 'Policía', '110'),
      t('medico', 'Guardia médica', 'Médico de guardia no urgente', '116 117'),
    ],
    embajada: {
      direccion: 'Von-der-Heydt-Str. 2',
      ciudad: 'Berlín',
      telefono: '+49 30 226 6890',
      guardia: '+49 172 3141100',
      web: 'https://ealem.cancilleria.gob.ar',
    },
    precauciones: [SCHENGEN_SEGURO, ETIAS, 'Llevá algo de efectivo: en muchos lugares no aceptan tarjeta.'],
  },

  PT: {
    codigo: 'PT',
    nombre: 'Portugal',
    telefonos: [UNICO('112')],
    embajada: {
      direccion: 'Av. João Crisóstomo 8, r/c Esq.',
      ciudad: 'Lisboa',
      telefono: '+351 21 795 9223',
      guardia: '+351 919 021 535',
      web: 'https://eport.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas en tranvías (como el 28) y zonas turísticas de Lisboa.',
    ],
  },

  NL: {
    codigo: 'NL',
    nombre: 'Países Bajos',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía (no urgente)', 'Denuncias no urgentes', '0900 8844'),
    ],
    embajada: {
      direccion: 'Javastraat 20',
      ciudad: 'La Haya',
      telefono: '+31 70 311 8411',
      guardia: '+31 6 1984 6595',
      web: 'https://epbaj.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'No camines por las bicisendas (las rojas): las bicis tienen prioridad.',
    ],
  },

  CH: {
    codigo: 'CH',
    nombre: 'Suiza',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Policía', '117'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '144'),
      t('bomberos', 'Bomberos', 'Incendios', '118'),
      t('rega', 'Rega', 'Rescate aéreo en montaña', '1414'),
    ],
    embajada: {
      direccion: 'Jungfraustrasse 1',
      ciudad: 'Berna',
      telefono: '+41 31 356 43 42',
      guardia: '+41 79 817 79 72',
      web: 'https://esuiz.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'La atención médica es muy cara: seguro con buena cobertura (y rescate en montaña si hacés trekking/esquí).',
      'En montaña, chequeá el clima antes de salir.',
    ],
  },

  GR: {
    codigo: 'GR',
    nombre: 'Grecia',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Policía', '100'),
      t('ambulancia', 'Ambulancia (EKAB)', 'Emergencias médicas', '166'),
      t('bomberos', 'Bomberos', 'Incendios', '199'),
      t('turismo', 'Policía turística', 'Asistencia al turista', '1571'),
    ],
    embajada: {
      direccion: 'Vasilissis Sofias 59, 3er piso',
      ciudad: 'Atenas',
      telefono: '+30 210 722 4710',
      guardia: '+30 694 972 4122',
      web: 'https://egrec.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'En verano hay incendios forestales y calor extremo: seguí las alertas del 112.',
      'Carteristas en el metro de Atenas.',
    ],
  },

  IE: {
    codigo: 'IE',
    nombre: 'Irlanda',
    telefonos: [UNICO('112', 'Policía, ambulancia y bomberos (también 999)')],
    embajada: {
      direccion: '15 Ailesbury Drive, Ballsbridge',
      ciudad: 'Dublín',
      telefono: '+353 1 269 1546',
      guardia: '+353 87 980 5098',
      web: 'https://eirla.cancilleria.gob.ar',
    },
    precauciones: [
      'Irlanda NO es Schengen: el control migratorio es aparte.',
      'Los autos vienen por la izquierda: mirá a la derecha antes de cruzar.',
      'Viajá con asistencia al viajero.',
    ],
  },

  JP: {
    codigo: 'JP',
    nombre: 'Japón',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '110'),
      t('ambulancia', 'Ambulancia y bomberos', 'Emergencias médicas e incendios', '119'),
    ],
    embajada: {
      direccion: '2-14-14 Moto Azabu, Minato-ku',
      ciudad: 'Tokio',
      telefono: '+81 3 5420-7101',
      guardia: '+81 80 1327 9416',
      web: 'https://ejapo.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 90 días.',
      'Zona sísmica: si tiembla, protegete bajo una mesa y seguí las alertas de tsunami.',
      'Llevá efectivo: todavía hay lugares que no aceptan tarjeta.',
      'Algunos medicamentos comunes (ej. con pseudoefedrina) están prohibidos: chequeá antes.',
    ],
  },

  TH: {
    codigo: 'TH',
    nombre: 'Tailandia',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '191'),
      t('turismo', 'Policía turística', 'Asistencia al turista (habla inglés)', '1155'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '1669'),
      t('bomberos', 'Bomberos', 'Incendios', '199'),
    ],
    embajada: {
      direccion: 'Floor 16, Vasu 1 Building, No. 1, Soi 25, Sukhumvit Road, 10110',
      ciudad: 'Bangkok',
      telefono: '+66 2 259 0401',
      guardia: '+66 85 221 9398',
      web: 'https://etail.cancilleria.gob.ar',
    },
    precauciones: [
      'Completá la TDAC (tarjeta digital de arribo) antes de llegar.',
      'Dengue: usá repelente. No tomes agua de la canilla.',
      'Estafas comunes: tuk-tuks "baratos", tiendas de gemas, alquiler de motos. Negociá antes.',
      'Las leyes de drogas son muy duras.',
    ],
  },

  AU: {
    codigo: 'AU',
    nombre: 'Australia',
    telefonos: [UNICO('000', 'Policía, ambulancia y bomberos (desde celular también 112)')],
    embajada: {
      direccion: '11 National Circuit, piso 2, Barton',
      ciudad: 'Canberra',
      telefono: '+61 2 6273 9111',
      guardia: '+61 405 355 461',
      web: 'https://eaust.cancilleria.gob.ar',
    },
    precauciones: [
      'Necesitás visa tramitada antes de viajar.',
      'Sol muy fuerte: protector solar y sombrero.',
      'En playas, nadá entre las banderas rojas y amarillas (corrientes fuertes).',
      'Controles estrictos de alimentos al entrar: declará todo.',
    ],
  },

  NZ: {
    codigo: 'NZ',
    nombre: 'Nueva Zelanda',
    telefonos: [UNICO('111')],
    embajada: {
      direccion: 'Level 5, 15 Murphy Street, 6011',
      ciudad: 'Wellington',
      telefono: '+64 4 472 8330',
      guardia: '+64 21 411 316',
      web: 'https://enzel.cancilleria.gob.ar',
    },
    precauciones: [
      'Necesitás NZeTA antes de viajar.',
      'Controles estrictos de alimentos y equipo outdoor al entrar: declará todo.',
      'En montaña el clima cambia rápido: avisá tu ruta antes de salir.',
    ],
  },

  IL: {
    codigo: 'IL',
    nombre: 'Israel',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales (112 desde celular)', '100'),
      t('ambulancia', 'Magen David Adom', 'Ambulancia', '101'),
      t('bomberos', 'Bomberos', 'Incendios', '102'),
    ],
    embajada: {
      direccion: 'Medinat Hayehudim 85, 2º piso',
      ciudad: 'Herzliya',
      telefono: '+972 73 252 0800',
      guardia: '+972 52 386 9501',
      web: 'https://eisra.cancilleria.gob.ar',
    },
    precauciones: [
      'Revisá las alertas de Cancillería antes de viajar: hay conflicto en la región.',
      'Si suenan las sirenas, andá al refugio más cercano y seguí al Comando del Frente Interno.',
      'Necesitás ETA-IL (autorización electrónica) antes de viajar.',
    ],
  },

  AE: {
    codigo: 'AE',
    nombre: 'Emiratos Árabes Unidos',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '999'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '998'),
      t('bomberos', 'Defensa Civil', 'Bomberos', '997'),
    ],
    embajada: {
      direccion: 'Aminah bint Wahab St, Villa 238, Al Karamah',
      ciudad: 'Abu Dhabi',
      telefono: null,
      guardia: '+971 50 611 3274',
      web: 'https://eearb.cancilleria.gob.ar',
    },
    precauciones: [
      'Revisá las alertas de Cancillería: la embajada recomendó evitar viajes no esenciales por la situación regional.',
      'Leyes y costumbres estrictas (alcohol, vestimenta, demostraciones de afecto en público).',
      'Algunos medicamentos requieren receta/permiso: llevá la receta.',
      'Calor extremo en verano: hidratate.',
    ],
  },

  CN: {
    codigo: 'CN',
    nombre: 'China',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '110'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '120'),
      t('bomberos', 'Bomberos', 'Incendios', '119'),
    ],
    embajada: {
      direccion: 'No. 11 Dong Wu Jie, San Li Tun',
      ciudad: 'Pekín',
      telefono: '+86 10 6532 1406',
      guardia: '+86 138 1085 4349',
      web: 'https://echin.cancilleria.gob.ar',
    },
    precauciones: [
      'Exención de visa de hasta 30 días (vigente hasta el 31/12/2026): chequeá si sigue antes de viajar.',
      'Google, WhatsApp e Instagram están bloqueados: configurá eSIM/roaming o VPN antes.',
      'Instalá Alipay o WeChat Pay: casi no se usa efectivo ni tarjeta extranjera.',
      'No tomes agua de la canilla.',
    ],
  },

  AT: {
    codigo: 'AT',
    nombre: 'Austria',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Polizei', 'Policía', '133'),
      t('ambulancia', 'Rettung', 'Emergencias médicas', '144'),
      t('bomberos', 'Feuerwehr', 'Bomberos', '122'),
      t('montana', 'Bergrettung', 'Rescate en montaña', '140'),
    ],
    embajada: {
      direccion: 'Lugeck 1, 7.º piso, 1010 (Sección Consular: Lugeck 2, 7.º piso)',
      ciudad: 'Viena',
      telefono: '+43 1 533 5171',
      guardia: '+43 676 707 3336',
      web: 'https://etria.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Si hacés trekking o esquí, llevá seguro con rescate en montaña.',
      'Garrapatas en zonas de bosque: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
    ],
  },

  BE: {
    codigo: 'BE',
    nombre: 'Bélgica',
    telefonos: [
      UNICO('112', 'Ambulancia y bomberos'),
      t('policia', 'Policía', 'Urgencias policiales', '101'),
      t('medico', 'Médico de guardia', 'Consultas médicas no urgentes', '1733'),
    ],
    embajada: {
      direccion: 'Avenue Louise 283, piso 3, boîte 2, 1050',
      ciudad: 'Bruselas',
      telefono: '+32 2 647 7812',
      guardia: '+32 475 75 16 46',
      web: 'https://ebelg.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas en las estaciones de Bruselas (Midi y Nord) y en trenes internacionales.',
      'El 112 es para ambulancia y bomberos: para la policía llamá al 101.',
    ],
  },

  DK: {
    codigo: 'DK',
    nombre: 'Dinamarca',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía (no urgente)', 'Consultas y denuncias no urgentes', '114'),
      t('medico', 'Línea médica 1813', 'Urgencias no graves, sólo Copenhague y región capital', '1813'),
    ],
    embajada: {
      direccion: 'Borgergade 16, 4 piso, 1300 Copenhague K',
      ciudad: 'Copenhague',
      telefono: '+45 3315 8082',
      guardia: '+45 2244 3742',
      web: 'https://edina.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Groenlandia y las Islas Feroe no son Schengen: chequeá los requisitos de entrada antes de ir.',
      'Si estás en la región de Copenhague y no es grave, llamá al 1813 antes de ir a una guardia.',
      'Garrapatas: revisate después de andar por bosques o pastizales.',
    ],
  },

  SE: {
    codigo: 'SE',
    nombre: 'Suecia',
    telefonos: [
      UNICO('112'),
      t('policia', 'Polisen (no urgente)', 'Denuncias y consultas no urgentes', '114 14'),
      t('salud', 'Vårdguiden 1177', 'Consejo médico no urgente', '1177'),
    ],
    embajada: {
      direccion: 'Narvavägen 32, 2.º piso, 115 22',
      ciudad: 'Estocolmo',
      telefono: '+46 8 663 1965',
      guardia: '+46 70 873 5960',
      web: 'https://esuec.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE) y revisate al volver.',
      'En invierno hace mucho frío: llevá ropa adecuada si salís de excursión.',
    ],
  },

  NO: {
    codigo: 'NO',
    nombre: 'Noruega',
    telefonos: [
      t('policia', 'Politi', 'Policía (ambulancia: 113, bomberos: 110)', '112'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '113'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '110'),
      t('medico', 'Legevakt', 'Guardia médica no urgente', '116 117'),
      t('policia-no-urgente', 'Policía (no urgente)', 'Denuncias no urgentes', '02800'),
    ],
    embajada: {
      direccion: 'Drammensveien 39, 0271',
      ciudad: 'Oslo',
      telefono: '+47 22 55 24 48',
      guardia: '+47 948 26 318',
      web: 'https://enoru.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Ojo: acá el 112 es la policía. Para una ambulancia llamá al 113 y para bomberos al 110.',
      'Svalbard no es Schengen y hay rabia en animales silvestres: informate antes de ir.',
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
    ],
  },

  FI: {
    codigo: 'FI',
    nombre: 'Finlandia',
    telefonos: [
      UNICO('112'),
      t('medico', 'Línea médica', 'Urgencias médicas no graves', '116 117'),
    ],
    embajada: {
      direccion: 'Bulevardi 5 A 11, 00120',
      ciudad: 'Helsinki',
      telefono: '+358 9 4242 8700',
      guardia: '+358 50 502 0099',
      web: 'https://efinl.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'La frontera terrestre con Rusia está cerrada: no planees cruzar por ahí.',
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
      'En invierno hace mucho frío: llevá ropa adecuada si salís de excursión.',
    ],
  },

  IS: {
    codigo: 'IS',
    nombre: 'Islandia',
    telefonos: [
      UNICO('112'),
      t('salud', 'Línea de salud', 'Consultas médicas no urgentes, 24 h', '+354 513 1700'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Islandia: te atiende la embajada en Noruega (+47 22 55 24 48). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'El clima y las rutas cambian rápido: chequeá safetravel.is antes de salir y dejá tu plan de viaje.',
      'Bajate la app 112 Iceland: agiliza el pedido de ayuda en una emergencia.',
    ],
  },

  LU: {
    codigo: 'LU',
    nombre: 'Luxemburgo',
    telefonos: [
      UNICO('112', 'Ambulancia y bomberos'),
      t('policia', 'Policía', 'Urgencias policiales', '113'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Luxemburgo: te atiende la embajada en Bélgica (+32 2 647 7812). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'El 112 es para ambulancia y bomberos: para la policía llamá al 113.',
    ],
  },

  MT: {
    codigo: 'MT',
    nombre: 'Malta',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía (no urgente)', 'Consultas no urgentes', '119'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Malta: te atiende la embajada en Italia (+39 06 4807 3300). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'Si llegás desde un país con riesgo de fiebre amarilla (o hiciste escala de más de 12 h), te pueden pedir el certificado.',
      'Los autos vienen por la izquierda: mirá a la derecha antes de cruzar.',
    ],
  },

  CY: {
    codigo: 'CY',
    nombre: 'Chipre',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Emergencias policiales', '199'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Chipre: te atiende la embajada en Israel (+972 73 252 0800). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Chipre NO es Schengen: el control migratorio es aparte.',
      'El norte de la isla no está bajo control del gobierno de Chipre: entrá por Lárnaca o Pafos, porque entrar por Ercan se considera ilegal.',
      'Los autos vienen por la izquierda: mirá a la derecha antes de cruzar.',
      'Algunos medicamentos con receta pueden estar prohibidos: chequeá antes de viajar.',
    ],
  },

  AD: {
    codigo: 'AD',
    nombre: 'Andorra',
    telefonos: [
      UNICO('112', 'Emergencias generales'),
      t('policia', 'Policia', 'Policía', '110'),
      t('ambulancia', 'SUM', 'Urgencias médicas', '116'),
      t('bomberos', 'Bombers', 'Bomberos y rescate en montaña', '118'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Andorra: te atiende la embajada en España (+34 91 771 0500). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Andorra no es Schengen y no tiene aeropuerto: entrás por España o Francia, así que te rigen las reglas de Schengen.',
      'Llevá seguro médico: los convenios de salud de Andorra son con España, Francia y Portugal.',
      'En invierno las cadenas para nieve son obligatorias en el auto.',
      'Sol fuerte en altura y en la nieve: usá protector solar.',
    ],
  },

  PL: {
    codigo: 'PL',
    nombre: 'Polonia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Policja', 'Policía', '997'),
      t('ambulancia', 'Pogotowie', 'Emergencias médicas', '999'),
      t('bomberos', 'Straż Pożarna', 'Bomberos', '998'),
    ],
    embajada: {
      direccion: 'Aleje Jerozolimskie 123a, piso 10, 02-017',
      ciudad: 'Varsovia',
      telefono: '+48 22 617 60 28',
      guardia: '+48 506 067 852',
      web: 'https://epolo.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Junto a la frontera con Bielorrusia hay una zona de acceso prohibido: respetá los carteles y no te acerques.',
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
    ],
  },

  CZ: {
    codigo: 'CZ',
    nombre: 'Chequia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Policie', 'Policía', '158'),
      t('ambulancia', 'Záchranná služba', 'Emergencias médicas', '155'),
      t('bomberos', 'Hasiči', 'Bomberos', '150'),
    ],
    embajada: {
      direccion: 'Panská 6, 110 00 Praha 1',
      ciudad: 'Praga',
      telefono: '+420 224 212 449',
      guardia: '+420 725 050 743',
      web: 'https://eches.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Tolerancia cero con el alcohol al manejar, y en autopista necesitás viñeta electrónica.',
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
    ],
  },

  SK: {
    codigo: 'SK',
    nombre: 'Eslovaquia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Polícia', 'Policía', '158'),
      t('ambulancia', 'Záchranná služba', 'Emergencias médicas', '155'),
      t('bomberos', 'Hasiči', 'Bomberos', '150'),
      t('montana', 'Horská záchranná služba', 'Rescate en montaña', '18 300'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Eslovaquia: te atiende la embajada en Austria (+43 1 533 5171). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'En los Altos Tatras muchos senderos altos cierran desde el 1 de noviembre: chequeá antes de salir y llevá seguro con rescate.',
      'Garrapatas: si vas a estar mucho al aire libre, consultá por la vacuna contra la encefalitis (TBE).',
    ],
  },

  HU: {
    codigo: 'HU',
    nombre: 'Hungría',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Rendőrség', 'Policía', '107'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '104'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '105'),
    ],
    embajada: {
      direccion: 'Vérhalom utca 12-16, Edificio A/21, 1023',
      ciudad: 'Budapest',
      telefono: '+36 1 326 0492',
      guardia: '+36 30 900 9507',
      web: 'https://eungr.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Tolerancia cero con el alcohol al manejar, y en autopista necesitás viñeta (matrica).',
      'En bares y clubes del distrito V de Budapest cobran cuentas abusivas: mirá la carta y desconfiá de las invitaciones en la calle.',
      'Carteristas en transporte público y estaciones; cambiá plata sólo en bancos u oficinas de cambio.',
    ],
  },

  SI: {
    codigo: 'SI',
    nombre: 'Eslovenia',
    telefonos: [
      UNICO('112', 'Ambulancia, bomberos y rescate en montaña'),
      t('policia', 'Policija', 'Policía', '113'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Eslovenia: te atiende la embajada en Viena (+43 1 533 5171; guardia +43 676 707 3336). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'Llevá el pasaporte o una copia: si la policía te pide identificación y no la tenés, la multa es de €50 a €200.',
      'En bosques y montaña hay garrapatas que transmiten encefalitis: usá repelente y revisate al volver.',
    ],
  },

  HR: {
    codigo: 'HR',
    nombre: 'Croacia',
    telefonos: [
      UNICO('112', 'Número único europeo'),
      t('policia', 'Policija', 'Policía. Con celular extranjero: +385 192', '192'),
      t('ambulancia', 'Hitna pomoć', 'Emergencias médicas. Con celular extranjero: +385 194', '194'),
      t('bomberos', 'Vatrogasci', 'Bomberos. Con celular extranjero: +385 193', '193'),
      t('rescate-maritimo', 'Rescate marítimo', 'Búsqueda y rescate en el mar. Con celular extranjero: +385 195', '195'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Croacia: te atiende la embajada en Budapest (+36 1 326 0492; guardia +36 30 900 9507). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'Llevá siempre el pasaporte encima.',
      'Si salís de las zonas turísticas, ojo con las minas sin detonar en áreas afectadas por la guerra: respetá los carteles.',
    ],
  },

  RO: {
    codigo: 'RO',
    nombre: 'Rumania',
    telefonos: [UNICO('112')],
    embajada: {
      direccion: 'Grigore Alexandrescu 59, piso 4, 010623',
      ciudad: 'Bucarest',
      telefono: '+40 21 312 2626',
      guardia: '+40 734 444 470',
      web: 'https://eruma.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Cerca de la frontera con Ucrania cayeron restos de drones: si ves uno, no lo toques y llamá al 112.',
      'En zonas rurales y de montaña hay osos y perros sueltos: no te acerques.',
      'Si manejás, comprá la viñeta para usar las rutas nacionales: sin ella, la multa es alta.',
    ],
  },

  BG: {
    codigo: 'BG',
    nombre: 'Bulgaria',
    telefonos: [UNICO('112', 'Número único europeo')],
    embajada: {
      direccion: 'Frederic Joliot-Curie 19, bloque 1, piso 4, depto. 6, Izgrev, 1113',
      ciudad: 'Sofía',
      telefono: '+359 2 971 2539',
      guardia: '+359 887 446 383',
      web: 'https://ebulg.cancilleria.gob.ar',
    },
    precauciones: [
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas y robos de bolsos en ciudades grandes, sobre todo de noche.',
      'En el aeropuerto de Sofía, sacá el taxi en el puesto de arribos para evitar sobreprecios.',
      'No saques fotos cerca de instalaciones militares.',
    ],
  },

  EE: {
    codigo: 'EE',
    nombre: 'Estonia',
    telefonos: [UNICO('112')],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Estonia: te atiende la embajada en Helsinki (+358 9 4242 8700; guardia +358 50 502 0099). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'Carteristas en bares y boliches del casco viejo de Tallinn.',
      'En bosques hay garrapatas que transmiten encefalitis: usá repelente y revisate al volver.',
    ],
  },

  LV: {
    codigo: 'LV',
    nombre: 'Letonia',
    telefonos: [
      UNICO('112', 'Bomberos y emergencias generales'),
      t('policia', 'Policija', 'Policía', '110'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '113'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Letonia: te atiende la embajada en Helsinki (+358 9 4242 8700; guardia +358 50 502 0099). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'A menos de 2 km de la frontera con Bielorrusia necesitás un permiso especial: no te acerques sin él.',
      'En bosques hay garrapatas que transmiten encefalitis: usá repelente y revisate al volver.',
    ],
  },

  LT: {
    codigo: 'LT',
    nombre: 'Lituania',
    telefonos: [UNICO('112')],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Lituania: te atiende la embajada en Varsovia (+48 22 617 6028; guardia +48 506 067 852). Ante una emergencia, llamá a la guardia de Cancillería.',
      SCHENGEN_SEGURO,
      ETIAS,
      'Usá taxis por app o pedidos por teléfono, con taxímetro prendido.',
      'En bosques hay garrapatas que transmiten encefalitis: usá repelente y revisate al volver.',
    ],
  },

  RS: {
    codigo: 'RS',
    nombre: 'Serbia',
    telefonos: [
      t('policia', 'Policija', 'Emergencias policiales (el 112 todavía no es confiable en todo el país)', '192'),
      t('ambulancia', 'Hitna pomoć', 'Emergencias médicas', '194'),
      t('bomberos', 'Vatrogasci', 'Incendios y rescates', '193'),
    ],
    embajada: {
      direccion: 'Knez Mihailova 24/I, 11000',
      ciudad: 'Belgrado',
      telefono: '+381 11 262 3751',
      guardia: '+381 63 377 197',
      web: 'https://eserb.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa para turismo hasta 90 días cada 6 meses. Serbia NO es Schengen.',
      'A menos de 10 km de la frontera con Kosovo hay tensión y minas: extremá el cuidado y no salgas de las rutas principales.',
      'Hay marchas en Belgrado y otras ciudades que cortan el transporte: alejate.',
    ],
  },

  AL: {
    codigo: 'AL',
    nombre: 'Albania',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Policía', '129'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '127'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '128'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Albania: te atiende la embajada en Roma (+39 06 4807 3300; guardia +39 335 387 607). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Albania NO es Schengen. No se pide visa para estadías cortas de turismo: confirmá el plazo antes de viajar.',
      'Las ambulancias son muy limitadas: si es grave, puede ser más rápido ir en taxi o auto al hospital.',
      'Cerca de la frontera noreste quedan zonas señalizadas por minas: respetá los carteles y no salgas de los senderos.',
    ],
  },

  ME: {
    codigo: 'ME',
    nombre: 'Montenegro',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policija', 'Policía', '122'),
      t('ambulancia', 'Hitna pomoć', 'Emergencias médicas', '124'),
      t('bomberos', 'Vatrogasci', 'Incendios y rescates', '123'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Montenegro: te atiende la embajada en Belgrado (+381 11 262 3751; guardia +381 63 377 197). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Entrás sin visa hasta 90 días. Montenegro NO es Schengen.',
      'Zona sísmica, y en verano hay incendios forestales: seguí las indicaciones de las autoridades.',
      'Carteristas en playas, aeropuertos y transporte público.',
    ],
  },

  BA: {
    codigo: 'BA',
    nombre: 'Bosnia y Herzegovina',
    telefonos: [
      t('policia', 'Policija', 'Emergencias policiales (también 112, que puede no funcionar en todo el país)', '122'),
      t('ambulancia', 'Hitna pomoć', 'Emergencias médicas', '124'),
      t('bomberos', 'Vatrogasci', 'Incendios y rescates', '123'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Bosnia y Herzegovina: te atiende la embajada en Budapest (+36 1 326 0492; guardia +36 30 900 9507). Ante una emergencia, llamá a la guardia de Cancillería.',
      'No necesitás visa para entrar. El país NO es Schengen: confirmá el plazo de estadía antes de viajar.',
      'Quedan minas sin señalizar en zonas rurales y de montaña: no salgas de caminos y senderos marcados.',
      'En invierno las rutas secundarias son peligrosas por nieve, hielo y niebla.',
      'Carteristas en el transporte público y en las zonas turísticas de Sarajevo.',
    ],
  },

  MK: {
    codigo: 'MK',
    nombre: 'Macedonia del Norte',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales (también 112, número nuevo)', '192'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '194'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '193'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Macedonia del Norte: te atiende la embajada en Sofía (+359 2 971 2539; guardia +359 887 446 383). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Macedonia del Norte NO es Schengen. Confirmá con Cancillería si necesitás visa antes de viajar.',
      'Zona sísmica, y en verano son comunes los incendios forestales.',
    ],
  },

  TR: {
    codigo: 'TR',
    nombre: 'Turquía',
    telefonos: [UNICO('112')],
    embajada: {
      direccion: 'Karaca Sokak 19, Gaziosmanpaşa, 06700',
      ciudad: 'Ankara',
      telefono: '+90 312 446 2061',
      guardia: '+90 533 548 9718',
      web: 'https://eturq.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 90 días. Llevá siempre el pasaporte original: hay controles de identidad y es obligatorio.',
      'No vayas a las zonas de frontera con Siria e Irak.',
      'Hubo muertes por alcohol adulterado con metanol: comprá sólo en lugares confiables.',
      'Es zona sísmica: si tiembla, protegete y seguí a las autoridades.',
      'En Estambul hay consulado argentino, con guardia propia: +90 530 041 7882.',
    ],
  },

  UA: {
    codigo: 'UA',
    nombre: 'Ucrania',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Policía', '102'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '103'),
      t('bomberos', 'Servicio de rescate', 'Incendios, rescates y explosivos sin detonar', '101'),
    ],
    embajada: {
      direccion: 'Ivana Fedorova 12, piso 6, 01901',
      ciudad: 'Kiev',
      telefono: '+380 44 238 6922',
      guardia: '+380 97 139 0373',
      web: 'https://eucra.cancilleria.gob.ar',
    },
    precauciones: [
      'Hay guerra: la Embajada argentina en Kiev sugirió a los argentinos abandonar Ucrania (aviso de 2022). Evitá viajar y revisá las alertas de Cancillería.',
      'El espacio aéreo está cerrado y rige la ley marcial: respetá los toques de queda y las órdenes de evacuación.',
      'Si suena la alarma antiaérea, andá a un refugio y alejate de las ventanas.',
      'Hay minas y explosivos sin detonar, sobre todo en el sur y el este: no toques nada y avisá al 101.',
      'Hay acuerdo bilateral sin visa para turismo hasta 90 días: confirmalo con la Embajada antes de viajar.',
    ],
  },

  RU: {
    codigo: 'RU',
    nombre: 'Rusia',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Policía', '102'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '103'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '101'),
    ],
    embajada: {
      direccion: 'Bolshaya Ordynka 72, 119017 (Sección Consular: 4-y Dobryninskiy Pereulok 8)',
      ciudad: 'Moscú',
      telefono: '+7 495 502 1020',
      guardia: '+7 903 725 1449',
      web: 'https://efrus.cancilleria.gob.ar',
    },
    precauciones: [
      'Por la guerra con Ucrania, la Embajada argentina recomienda máxima prudencia y evitar Rostov, Voronezh, Belgorod, Kursk, Bryansk, la frontera y las instalaciones militares.',
      'Entrás sin visa hasta 90 días cada 180. Completá el registro en la app ruID hasta 72 horas antes: la etapa voluntaria terminó el 30/6/2026.',
      'Visa, Mastercard y American Express NO funcionan: llevá dólares o euros en efectivo, en perfecto estado.',
      'Viajá con seguro médico amplio: los hospitales públicos no atienden turistas salvo riesgo de vida.',
      'Hubo argentinos demorados en aeropuertos por tener sellos de Ucrania en el pasaporte.',
    ],
  },

  GT: {
    codigo: 'GT',
    nombre: 'Guatemala',
    telefonos: [
      t('policia', 'Policía Nacional Civil', 'Emergencias policiales (también 120)', '110'),
      t('ambulancia', 'Bomberos y ambulancia', 'Emergencias médicas e incendios (también 123)', '122'),
      t('conred', 'CONRED', 'Sismos, volcanes y desastres', '119'),
      t('turismo', 'Asistencia al turista (INGUAT)', 'Línea gratuita las 24 h', '1500'),
    ],
    embajada: {
      direccion: '5ta avenida 6-50, Zona 14',
      ciudad: 'Ciudad de Guatemala',
      telefono: '+502 2464-5900',
      guardia: '+502 5649-3078',
      web: 'https://eguat.cancilleria.gob.ar',
    },
    precauciones: [
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Malaria en Alta Verapaz, Baja Verapaz, Escuintla, Izabal y Petén: consultá profilaxis antes de viajar. En la capital, Antigua y Atitlán no hay.',
      'No tomes agua de la canilla.',
      'Hay asaltos y secuestros exprés: no te resistas, no viajes de noche y evitá los colectivos.',
      'Para subir volcanes, andá de día, en grupo y con guía: hay asaltos en los senderos.',
    ],
  },

  SV: {
    codigo: 'SV',
    nombre: 'El Salvador',
    telefonos: [
      UNICO('911'),
      t('ambulancia', 'Emergencias médicas', 'Ambulancia (o pedí el 132 al 911)', '132'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '913'),
    ],
    embajada: {
      direccion: 'Colonia Maquilishuat y Avenida El Almendro # 2-5',
      ciudad: 'San Salvador',
      telefono: '+503 2521-9400',
      guardia: '+503 7862-6494',
      web: 'https://esalv.cancilleria.gob.ar',
    },
    precauciones: [
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Sigue vigente el estado de excepción: la policía puede detenerte con facilidad. Llevá documento y colaborá en los controles.',
      'Los tatuajes pueden interpretarse como señal de pertenencia a pandillas.',
      'No participes en manifestaciones ni actividades políticas: te pueden detener y deportar.',
      'Usá taxis pedidos por el hotel o por teléfono, y sacá plata de cajeros dentro de shoppings.',
    ],
  },

  HN: {
    codigo: 'HN',
    nombre: 'Honduras',
    telefonos: [
      UNICO('911', 'Sistema Nacional de Emergencias'),
      t('ambulancia', 'Cruz Roja', 'Ambulancia', '195'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '198'),
    ],
    embajada: {
      direccion: 'Calle Palermo 302, Col. Rubén Darío',
      ciudad: 'Tegucigalpa',
      telefono: '+504 2243-4778',
      guardia: '+504 9969-7424',
      web: 'https://ehond.cancilleria.gob.ar',
    },
    precauciones: [
      'Exigen certificado de fiebre amarilla de 1 a 60 años si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Malaria en gran parte del país, incluidas Roatán y las Islas de la Bahía: consultá profilaxis. En Tegucigalpa y San Pedro Sula no hay.',
      'Tomá sólo agua embotellada.',
      'Mucha inseguridad: no camines de noche por las ciudades ni viajes de noche por ruta. Usá taxis de confianza y no te resistas a un asalto.',
      'Tenés que completar la Declaración Regional del Viajero para entrar y salir.',
    ],
  },

  NI: {
    codigo: 'NI',
    nombre: 'Nicaragua',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '118'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '128'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '115'),
    ],
    embajada: {
      direccion: 'Las Colinas, Calle Prado Ecuestre 235 B (intersección con Calle Los Mangos)',
      ciudad: 'Managua',
      telefono: '+505 2255-0089',
      guardia: '+505 8120-0900',
      web: 'https://enica.cancilleria.gob.ar',
    },
    precauciones: [
      'Exigen certificado de fiebre amarilla a quienes llegan de países de riesgo, incluida Argentina: llevá el original.',
      'Malaria en las regiones de la costa Caribe (RAAN y RAAS): consultá profilaxis. En Managua no hay.',
      'Tomá sólo agua embotellada.',
      'Los extranjeros no pueden participar en política ni en manifestaciones. Pueden revisarte el celular en controles.',
      'Prohibido entrar con drones. Entrar o salir por pasos no habilitados es delito (2 a 6 años de prisión).',
    ],
  },

  BZ: {
    codigo: 'BZ',
    nombre: 'Belice',
    telefonos: [
      UNICO('911'),
      t('bomberos', 'Bomberos y ambulancia', 'Sólo en Belize City', '90'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Belice: te atiende la embajada en México (+52 55 5520-9430, guardia +52 55 4603-2654). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Malaria en algunas zonas, sobre todo Stann Creek: consultá antes de viajar.',
      'No tomes agua de la canilla.',
      'Evitá el sur de Belize City por las pandillas, no viajes de noche y cruzá las fronteras sólo por pasos oficiales.',
      'La posesión de drogas es delito grave y las cárceles son muy duras.',
    ],
  },

  JM: {
    codigo: 'JM',
    nombre: 'Jamaica',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '119'),
      t('ambulancia', 'Ambulancia y bomberos', 'Emergencias médicas e incendios (también 112)', '911'),
    ],
    embajada: {
      direccion: '40 Knutsford Blvd., 4th floor, Kingston 5',
      ciudad: 'Kingston',
      telefono: '+1 876 926-5588',
      guardia: '+1 876 369-9372',
      web: 'https://ejama.cancilleria.gob.ar',
    },
    precauciones: [
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Temporada de huracanes hasta el 30 de noviembre. Tras el huracán Melissa, algunos hoteles siguen cerrados: confirmá tu reserva.',
      'Usá sólo taxis con licencia o pedidos por el hotel, y no camines solo de noche.',
      'Intentar sacar marihuana del país puede tratarse como narcotráfico.',
      'Para estadías cortas, tomá agua embotellada. Los autos vienen por la izquierda.',
    ],
  },

  BS: {
    codigo: 'BS',
    nombre: 'Bahamas',
    telefonos: [UNICO('911', 'Policía, ambulancia y bomberos (también 919)')],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Bahamas: te atiende la embajada en Jamaica (+1 876 926-5588, guardia +1 876 369-9372). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Temporada de huracanes hasta el 30 de noviembre: seguí las indicaciones de las autoridades.',
      'En Nassau, cuidate de noche en Over the Hill y Fish Fry. No uses taxis sin licencia.',
      'Los autos vienen por la izquierda.',
    ],
  },

  MA: {
    codigo: 'MA',
    nombre: 'Marruecos',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales en ciudades', '190'),
      t('ambulancia', 'Bomberos y ambulancia', 'Emergencias médicas e incendios', '150'),
      t('gendarmeria', 'Gendarmería Real', 'Zonas rurales y rutas', '177'),
    ],
    embajada: {
      direccion: '4, Av. Mehdi Ben Barka, Souissi',
      ciudad: 'Rabat',
      telefono: '+212 537 75 51 20',
      guardia: '+212 661 29 73 19',
      web: 'https://emarr.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 90 días. Te pueden pedir pasaje de regreso y fondos; revisá que te sellen el pasaporte al llegar.',
      'Drogas: tolerancia cero, aun para consumo propio (2 a 10 años de prisión). El cannabis no es legal para turistas.',
      'Algunos ansiolíticos y analgésicos pueden ser ilegales: llevá la caja original y la receta.',
      'Tomá agua embotellada fuera de las grandes ciudades.',
      'Hay robos en las ciudades. Si tenés un accidente en la ruta, no muevas el auto hasta que llegue la Gendarmería.',
    ],
  },

  EG: {
    codigo: 'EG',
    nombre: 'Egipto',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '122'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '123'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '180'),
      t('turismo', 'Policía turística', 'Asistencia y denuncias del turista', '126'),
    ],
    embajada: {
      direccion: 'Villa N° 14, Calle Refaah, Dokki, Giza',
      ciudad: 'El Cairo',
      telefono: '+20 2 3335-3576',
      guardia: '+20 122 317 8512',
      web: 'https://eegip.cancilleria.gob.ar',
    },
    precauciones: [
      'Llevá el certificado internacional de fiebre amarilla original en papel: la embajada argentina lo pide para entrar a Egipto.',
      'Necesitás visa: tramitala en Buenos Aires o pagala al llegar al aeropuerto de El Cairo (30 días). Pasaporte con 6 meses de vigencia.',
      'No tomes agua de la canilla ni con hielo.',
      'No vayas al norte del Sinaí ni a la frontera de Rafah, y evitá manejar de noche. Fuera de las rutas señalizadas puede haber minas.',
      'Prohibido entrar con drones y fotografiar instalaciones militares o el Canal de Suez. Si sufrís un delito, denuncialo a la policía turística antes de irte.',
    ],
  },

  ZA: {
    codigo: 'ZA',
    nombre: 'Sudáfrica',
    telefonos: [
      UNICO('112', 'Emergencias desde celular'),
      t('policia', 'Policía', 'Emergencias policiales e incendios', '10111'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '10177'),
    ],
    embajada: {
      direccion: '2nd floor, Standard Plaza Building, 440 Hilda Street, Hatfield 0083',
      ciudad: 'Pretoria',
      telefono: '+27 12 430 3524',
      guardia: '+27 60 992 1682',
      web: 'https://esafr.cancilleria.gob.ar',
    },
    precauciones: [
      'Tu pasaporte necesita al menos 2 páginas sin usar para entrar.',
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Malaria en Kruger y zonas bajas de Limpopo, Mpumalanga y KwaZulu-Natal: consultá profilaxis.',
      'Delincuencia alta y a menudo violenta: no manejes de noche, usá cajeros de bancos y andá a los townships sólo con guía.',
      'El Consulado en Johannesburgo tiene guardia para emergencias consulares: +27 83 453 7930.',
    ],
  },

  KE: {
    codigo: 'KE',
    nombre: 'Kenia',
    telefonos: [UNICO('999', 'Emergencias y policía (también 112)')],
    embajada: {
      direccion: '4th Floor, Eaton Place Building, United Nations Crescent Road, Gigiri',
      ciudad: 'Nairobi',
      telefono: '+254 20 232 4673',
      guardia: '+254 791 258 635',
      web: 'https://ekeny.cancilleria.gob.ar',
    },
    precauciones: [
      'Antes de viajar necesitás la eTA y, desde el 5/10/2026, el seguro de salud del gobierno de Kenia: un seguro extranjero no lo reemplaza.',
      'Fiebre amarilla: vacuna recomendada (salvo viajes sólo a Nairobi, la costa o el noreste). Exigen certificado si llegás de un país de riesgo, y Argentina figura en la lista de la OMS.',
      'Malaria en todo el país por debajo de 2.500 m, incluidos los parques: tomá profilaxis. Sólo el centro de Nairobi no la necesita.',
      'Tomá agua mineral o hervida.',
      'Riesgo de terrorismo: no vayas a la frontera con Somalia y evitá las protestas.',
    ],
  },

  TZ: {
    codigo: 'TZ',
    nombre: 'Tanzania',
    telefonos: [
      UNICO('112', 'Policía y ambulancia'),
      t('ambulancia', 'Emergencias sanitarias', 'Ambulancia', '199'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '114'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Tanzania: te atiende la embajada en Kenia (+254 20 232 4673, guardia +254 791 258 635). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Necesitás visa y el seguro de viaje del gobierno, aunque tengas otro: sin el seguro te pueden rechazar en la entrada.',
      'Pueden pedirte certificado de fiebre amarilla: llevalo. Lo exigen si llegás de un país de riesgo, y Argentina figura en la lista de la OMS.',
      'Malaria por debajo de 1.800 m: consultá profilaxis. Hay cólera: tomá sólo agua embotellada o hervida.',
      'No vayas a Mtwara, evitá aglomeraciones y usá sólo taxis oficiales. Las drogas y las relaciones entre personas del mismo sexo se penan con cárcel.',
    ],
  },

  TN: {
    codigo: 'TN',
    nombre: 'Túnez',
    telefonos: [
      t('policia', 'Policía', 'Policía de socorro (también 193, Guardia Nacional)', '197'),
      t('ambulancia', 'SAMU', 'Emergencias médicas', '190'),
      t('bomberos', 'Protección Civil', 'Incendios y rescates', '198'),
    ],
    embajada: {
      direccion: 'Rue du Lac Victoria, Les Berges du Lac, 1053',
      ciudad: 'Túnez',
      telefono: '+216 71 860 122',
      guardia: '+216 54 572 777',
      web: 'https://etune.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 90 días como turista. Si te pasás, te exponés a multas e incluso prisión.',
      'No vayas a las zonas de frontera con Argelia y Libia.',
      'Evitá manifestaciones y manejar de noche. Cuidá tus cosas en las medinas.',
      'Prohibido fotografiar edificios oficiales. Los drones requieren autorización.',
      'Drogas: 1 a 5 años de prisión por posesión o consumo.',
    ],
  },

  SA: {
    codigo: 'SA',
    nombre: 'Arabia Saudita',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '999'),
      t('ambulancia', 'Media Luna Roja', 'Ambulancia', '997'),
      t('bomberos', 'Defensa Civil', 'Bomberos', '998'),
      t('emergencias', 'Emergencias', 'Línea unificada (sin SIM saudita, 112)', '911'),
    ],
    embajada: {
      direccion: 'Villa 8, Habib Al Handali Road, Olaya District',
      ciudad: 'Riad',
      telefono: '+966 11 465 2600',
      guardia: '+966 50 328 9958',
      web: 'https://earab.cancilleria.gob.ar',
    },
    precauciones: [
      'Revisá las alertas de Cancillería antes de viajar: hay conflicto regional, con ataques de drones y misiles, y la embajada pidió evitar desplazamientos a la región.',
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo (Argentina figura en la lista de la OMS) o con escala de más de 12 h.',
      'Malaria en Asir y Jazán (frontera con Yemen): consultá profilaxis. No vayas a esa frontera.',
      'Leyes muy estrictas: alcohol prohibido, pena de muerte por tráfico de drogas, y las relaciones fuera del matrimonio y entre personas del mismo sexo se penan.',
      'Si vas a Hajj o Umrah, necesitás vacuna antimeningocócica ACWY. Los no musulmanes no pueden entrar a La Meca y Medina.',
    ],
  },

  QA: {
    codigo: 'QA',
    nombre: 'Catar',
    telefonos: [UNICO('999')],
    embajada: {
      direccion: 'Legtaifiya, Zone 66, Rawdat Ehraish St. No. 6',
      ciudad: 'Doha',
      telefono: '+974 4417 3601',
      guardia: '+974 5039 8775',
      web: 'https://eqatr.cancilleria.gob.ar',
    },
    precauciones: [
      'Revisá las alertas de Cancillería: por el conflicto regional recomendó no hacer viajes no esenciales y evitar escalas en aeropuertos del Golfo.',
      'Entrás sin visa hasta 90 días por turismo o negocios.',
      'Exigen certificado de fiebre amarilla si llegás de un país de riesgo, y Argentina figura en la lista de la OMS.',
      'Beber o estar borracho en público es delito, y el alcohol sólo se vende en lugares habilitados. Vapear también es ilegal.',
      'Drogas: penas severas aun por restos mínimos, también en tránsito. No saques fotos de personas sin su permiso.',
    ],
  },

  JO: {
    codigo: 'JO',
    nombre: 'Jordania',
    telefonos: [
      UNICO('911'),
      t('policia', 'Policía', 'Policía', '191'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '193'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Jordania: te atiende la sección consular de la embajada en Siria, que opera desde Beirut (guardia +963 933 884 050). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Revisá las alertas de Cancillería: la embajada recomendó NO viajar a Jordania por el conflicto regional. Si suenan sirenas, refugiate lejos de las ventanas.',
      'No vayas a las fronteras con Siria e Irak.',
      'Tomá agua embotellada.',
      'Leyes severas: insultar al país, al islam o al rey puede dar prisión, y un juicio puede impedirte salir. Medicamentos como Xanax, Tramal o Lyrica están prohibidos: llevá la receta.',
    ],
  },

  IN: {
    codigo: 'IN',
    nombre: 'India',
    telefonos: [
      UNICO('112'),
      t('policia', 'Policía', 'Emergencias policiales', '100'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas (también 102)', '108'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '101'),
    ],
    embajada: {
      direccion: 'F-3/3 Vasant Vihar, 110057',
      ciudad: 'Nueva Delhi',
      telefono: '+91 11 4078 1900',
      guardia: '+91 98186 62263',
      web: 'https://eindi.cancilleria.gob.ar',
    },
    precauciones: [
      'Si estás en Maharashtra (Mumbai), te atiende el Consulado General en Mumbai: guardia +91 99303 10617.',
      'Necesitás visa: tramitá la e-Visa en el sitio oficial (indianvisaonline.gov.in) al menos 4 días antes.',
      'Fiebre amarilla: Argentina figura como país de riesgo. Si llegás dentro de los 6 días de haber salido, necesitás el certificado original; sin él te pueden dejar 6 días en cuarentena.',
      'Hay malaria en buena parte del país, incluso en Delhi y Mumbai: consultá antes de viajar. Dengue: usá repelente. Tomá agua embotellada.',
      'No lleves vapeadores, teléfonos satelitales ni GPS sin licencia: es ilegal. Las leyes de drogas son duras.',
    ],
  },

  ID: {
    codigo: 'ID',
    nombre: 'Indonesia',
    telefonos: [
      t('emergencias', 'Emergencias', 'Emergencias generales y policía', '112'),
      t('policia', 'Policía', 'Emergencias policiales', '110'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas (también 119)', '118'),
      t('bomberos', 'Bomberos', 'Incendios', '113'),
      t('rescate', 'Basarnas', 'Búsqueda y rescate', '115'),
    ],
    embajada: {
      direccion: 'Menara Thamrin, Jl. M.H. Thamrin Kav. 3, 17th Floor, Suite 1705, 10250',
      ciudad: 'Yakarta',
      telefono: '+62 21 230 3061',
      guardia: '+62 816 919 121',
      web: 'https://eisia.cancilleria.gob.ar',
    },
    precauciones: [
      'Chequeá la visa antes de viajar: hacé la e-VOA (30 días) en el sitio oficial de migraciones y la declaración All Indonesia dentro de las 72 h antes de llegar.',
      'Fiebre amarilla: te piden el certificado si venís de un país de riesgo, y Argentina figura en la lista.',
      'Malaria en el este del país (Maluku, Papúa, Nusa Tenggara Oriental). No hay en Yakarta ni en Ubud.',
      'Dengue y zika (hay casos en viajeros que volvieron de Bali): usá repelente. Tomá agua embotellada.',
      'Por drogas podés enfrentar prisión larga o pena de muerte. Cuidado con el alcohol adulterado con metanol.',
    ],
  },

  VN: {
    codigo: 'VN',
    nombre: 'Vietnam',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '113'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '115'),
      t('bomberos', 'Bomberos', 'Incendios', '114'),
      t('rescate', 'Búsqueda y rescate', 'Rescate nacional', '112'),
    ],
    embajada: {
      direccion: '4th Floor, Leadvisors Place, 41A Ly Thai To St, Hoan Kiem Lake Dist.',
      ciudad: 'Hanoi',
      telefono: '+84 24 3831 5262',
      guardia: '+84 81 824 9100',
      web: 'https://eviet.cancilleria.gob.ar',
    },
    precauciones: [
      'Necesitás visa: sacá la e-visa antes de viajar y no salgas sin tenerla otorgada.',
      'Los números de emergencia atienden sólo en vietnamita: pedile ayuda a alguien del hotel.',
      'Malaria sólo en zonas rurales: no hay en Hanoi, Ho Chi Minh, Da Nang ni Nha Trang. Dengue: usá repelente. Tomá agua embotellada.',
      'Alquilá moto sólo si tenés experiencia: el casco es obligatorio y un accidente puede traerte cargos penales.',
      'Las drogas tienen penas durísimas, incluso de muerte. Los vapeadores están prohibidos: no los lleves.',
    ],
  },

  MY: {
    codigo: 'MY',
    nombre: 'Malasia',
    telefonos: [
      UNICO('999', 'Policía, ambulancia y bomberos (desde celular también 112)'),
      t('bomberos', 'Bomberos', 'Incendios y rescates', '994'),
    ],
    embajada: {
      direccion: 'Suite 16-03, Piso 16, Menara Keck Seng, 203 Jalan Bukit Bintang, 55100',
      ciudad: 'Kuala Lumpur',
      telefono: '+60 3 2144 1451',
      guardia: '+60 12 201 2464',
      web: 'https://emsia.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa por turismo, en general hasta 3 meses. Completá la tarjeta digital MDAC dentro de los 3 días antes de llegar.',
      'Fiebre amarilla: si venís de un país de riesgo (Argentina figura en la lista) o hiciste más de 12 h de escala en uno, llevá el certificado.',
      'Dengue: usá repelente. Hay malaria sólo en zonas rurales y selváticas, no en Kuala Lumpur.',
      'Las drogas se castigan con prisión larga, azotes e incluso pena de muerte.',
      'En la costa este de Sabah y sus islas hay riesgo de secuestros: informate antes de ir.',
    ],
  },

  SG: {
    codigo: 'SG',
    nombre: 'Singapur',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '999'),
      t('ambulancia', 'Ambulancia y bomberos', 'Emergencias médicas e incendios', '995'),
    ],
    embajada: {
      direccion: '7 Temasek Boulevard, Suntec Tower One, #15-03, 038987',
      ciudad: 'Singapur',
      telefono: '+65 6887 9808',
      guardia: '+65 9787 4442',
      web: 'https://esing.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa por turismo: los días te los fija migraciones al entrar. Completá gratis la SG Arrival Card en el sitio del ICA dentro de los 3 días antes de llegar.',
      'Fiebre amarilla: Argentina figura como país de riesgo. Si estuviste ahí en los 6 días previos, necesitás el certificado; sin él te pueden poner 6 días en cuarentena.',
      'Las leyes de drogas son durísimas: incluso cantidades chicas pueden llevar a la pena de muerte, también en tránsito.',
      'Los vapeadores están prohibidos: no los lleves. Hay multas en el acto por tirar basura, y no se fuma en parques ni playas.',
      'Dengue: usá repelente.',
    ],
  },

  PH: {
    codigo: 'PH',
    nombre: 'Filipinas',
    telefonos: [UNICO('911')],
    embajada: {
      direccion: '8th Floor, Liberty Center Building, 104 H.V. dela Costa Street, Salcedo Village, 1227',
      ciudad: 'Manila',
      telefono: '+63 2 8845 3218',
      guardia: '+63 917 836 6925',
      web: 'https://efili.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 30 días (prorrogables). Llevá pasaje de salida y registrate gratis en eTravel dentro de los 3 días antes de llegar.',
      'Fiebre amarilla: la embajada pide el certificado, emitido más de 10 días antes de llegar.',
      'Malaria en Palawan y Mindanao, no en Manila. Dengue: usá repelente. Tomá agua embotellada.',
      'No vayas al oeste y centro de Mindanao ni al archipiélago de Sulu: hay terrorismo y enfrentamientos armados.',
      'Hasta una cantidad chica de droga implica prisión obligatoria.',
    ],
  },

  KR: {
    codigo: 'KR',
    nombre: 'Corea del Sur',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '112'),
      t('ambulancia', 'Ambulancia y bomberos', 'Emergencias médicas e incendios', '119'),
      t('turismo', 'Línea turística', 'Asistencia al turista (habla inglés)', '1330'),
    ],
    embajada: {
      direccion: '5F, Chun Woo Bldg., 206 Noksapyeong-daero, Yongsan-gu, 04345',
      ciudad: 'Seúl',
      telefono: '+82 2 796 8144',
      guardia: '+82 10 2843 5056',
      web: 'https://ecore.cancilleria.gob.ar',
    },
    precauciones: [
      'Entrás sin visa hasta 90 días, pero necesitás la K-ETA aprobada: pedila al menos 72 h antes del vuelo o no te dejan embarcar.',
      'Podés completar la e-Arrival card gratis dentro de las 72 h antes de llegar, en vez del formulario en papel.',
      'Con drogas no hay margen: hasta poca marihuana puede terminar en cárcel, y hubo detenidos sólo por un test.',
      'Malaria sólo en zonas rurales del norte (Incheon, Gangwon, Gyeonggi), de marzo a diciembre.',
      'Si vas a la DMZ, seguí las indicaciones de las autoridades: la tensión con Corea del Norte cambia rápido.',
    ],
  },

  KH: {
    codigo: 'KH',
    nombre: 'Camboya',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '117'),
      t('ambulancia', 'Ambulancia', 'Emergencias médicas', '119'),
      t('bomberos', 'Bomberos', 'Incendios', '118'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Camboya: te atiende la embajada en Tailandia, en Bangkok (+66 2 259 0401; guardia +66 85 221 9398). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Necesitás visa: e-visa al menos 4 días antes o al llegar. Si entrás por avión, completá la e-Arrival Card dentro de los 7 días antes.',
      'Fiebre amarilla: te piden el certificado si venís de un país de riesgo, y Argentina figura en la lista.',
      'No te acerques a la frontera con Tailandia: hay tensión, pasos cerrados y minas. En zonas rurales no salgas de los caminos principales.',
      'Malaria en zonas rurales y selváticas, no en Phnom Penh ni Angkor. Dengue: usá repelente. Tomá agua embotellada. Con las drogas hay tolerancia cero.',
    ],
  },

  LK: {
    codigo: 'LK',
    nombre: 'Sri Lanka',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales (también 118)', '119'),
      t('ambulancia', 'Suwa Seriya', 'Ambulancia', '1990'),
      t('bomberos', 'Bomberos', 'Incendios y rescates (también ambulancia)', '110'),
      t('turismo', 'Policía turística', 'Asistencia al turista (Colombo)', '+94 11 242 1052'),
      t('turismo-linea', 'Línea de turismo', 'Asistencia al turista las 24 h', '1912'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Sri Lanka: te atiende la embajada en India, en Nueva Delhi (+91 11 4078 1900; guardia +91 98186 62263). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Necesitás ETA (autorización electrónica) antes de llegar: tramitala en eta.gov.lk.',
      'Fiebre amarilla: te piden el certificado si venís de un país de riesgo o hiciste escala en uno, y Argentina figura en la lista.',
      'Dengue: usá repelente. Hay malaria en algunas zonas. Si te muerde un perro, andá al médico enseguida: la vacuna antirrábica no siempre se consigue.',
      'Un tatuaje de Buda a la vista puede costarte la entrada o la deportación. Las drogas, incluido el cannabis, tienen penas severas.',
    ],
  },

  NP: {
    codigo: 'NP',
    nombre: 'Nepal',
    telefonos: [
      t('policia', 'Policía', 'Emergencias policiales', '100'),
      t('turismo', 'Policía turística', 'Asistencia al turista (habla inglés)', '1144'),
      t('ambulancia', 'Ambulancia', 'No hay servicio público central: si no responde, llamá al hospital más cercano', '102'),
      t('bomberos', 'Bomberos', 'Incendios', '101'),
    ],
    embajada: null,
    precauciones: [
      'Argentina no tiene embajada en Nepal: te atiende la embajada en India, en Nueva Delhi (+91 11 4078 1900; guardia +91 98186 62263). Ante una emergencia, llamá a la guardia de Cancillería.',
      'Chequeá los requisitos de visa en el sitio de migraciones de Nepal antes de viajar.',
      'Fiebre amarilla: te piden el certificado si venís de un país de riesgo, y Argentina figura en la lista.',
      'En trekking cuidate del mal de altura. Necesitás permiso, tarjeta TIMS y guía local o porteador en parques y áreas protegidas.',
      'Malaria sólo en zonas bajas del oeste, no en Katmandú, Pokhara ni los trekkings típicos. Evitá los buses de noche. Por drogas hay penas severas, incluso con poca marihuana.',
    ],
  },
}
