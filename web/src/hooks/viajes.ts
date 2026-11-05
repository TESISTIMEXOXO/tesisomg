import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorApi } from '../lib/api'
import { zonaHoraria } from '../lib/zonasHorarias'
import * as lugares from '../services/viajes'
import { useSesion } from './auth'
import * as viajes from '../services/viajes'
import type { NuevoViaje, Viaje } from '../types/viaje'
import type { EtapaViaje } from '../types/viaje'

export function useViajes() {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes', sesion?.id],
    queryFn: viajes.listar,
    enabled: Boolean(sesion?.id),
  })
}

export function useViajesSacados() {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes-sacados', sesion?.id],
    queryFn: viajes.listarSacados,
    enabled: Boolean(sesion?.id),
  })
}

export function useOcultarViaje() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (viajeId: string) => viajes.ocultar(viajeId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['viajes'] }),
      queryClient.invalidateQueries({ queryKey: ['viajes-sacados'] }),
    ]),
  })
}

export function useBuscarLugares(consulta: string) {
  return useQuery({
    queryKey: ['lugares', consulta],
    queryFn: () => lugares.buscarLugares(consulta),
    enabled: consulta.trim().length >= 3,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/*
 * Se vuelve a pedir cada 30 segundos con la pestaña a la vista: así, si a la persona la sacan del grupo,
 * se entera sola (el backend responde 410). Un 4xx no se reintenta: el viaje no va a aparecer.
 */
/** La clave en caché de un viaje: es por cuenta, para no mezclar lo de dos sesiones en el mismo navegador. */
export function claveDelViaje(sesionId: string | undefined, viajeId: string) {
  return ['viajes', sesionId, viajeId] as const
}

export function useViaje(id: string) {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: claveDelViaje(sesion?.id, id),
    queryFn: () => viajes.obtener(id),
    enabled: Boolean(sesion?.id && id),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: (intentos, error) => !(error instanceof ErrorApi && error.status >= 400 && error.status < 500) && intentos < 1,
  })
}

export function useResumenViaje(id: string) {
  const { data: sesion } = useSesion()
  return useQuery({
    queryKey: ['viajes', sesion?.id, id, 'resumen'],
    queryFn: () => viajes.resumen(id),
    enabled: Boolean(sesion?.id && id),
  })
}

export function useEmergencias(id: string) {
  return useQuery({ queryKey: ['viajes', id, 'emergencias'], queryFn: () => viajes.emergencias(id) })
}

/** El país de unas coordenadas. Redondea a ~1 km para no volver a preguntar con cada paso. */
/* Redondeado a ~1 km: mover el punto unos metros no tiene por qué cambiar el país ni volver a preguntar. */
const redondear = (grados: number) => Math.round(grados * 100) / 100

function consultaPais(lat: number, lng: number) {
  return { queryKey: ['lugares', 'pais', lat, lng], queryFn: () => viajes.paisEn(lat, lng), staleTime: Infinity }
}

export function usePaisEn(coordenadas: { lat: number; lng: number } | null) {
  const lat = coordenadas ? redondear(coordenadas.lat) : null
  const lng = coordenadas ? redondear(coordenadas.lng) : null
  return useQuery({ ...consultaPais(lat ?? 0, lng ?? 0), enabled: lat !== null && lng !== null })
}

/** La zona horaria de cada lugar, en el mismo orden. null mientras se averigua el país o si no está en la tabla. */
export function useZonasHorarias(puntos: { lat: number; lng: number }[]) {
  return useQueries({
    queries: puntos.map(({ lat, lng }) => consultaPais(redondear(lat), redondear(lng))),
    combine: (resultados) => resultados.map((resultado, i) => zonaHoraria(resultado.data?.codigo ?? null, puntos[i].lat, puntos[i].lng)),
  })
}

export function useInvitacion(codigo: string) {
  return useQuery({ queryKey: ['invitaciones', codigo], queryFn: () => viajes.verInvitacion(codigo), retry: false })
}

export function useCrearViaje() {
  const queryClient = useQueryClient()
  const { data: sesion } = useSesion()
  return useMutation({
    mutationFn: (datos: NuevoViaje) => viajes.crear(datos),
    onSuccess: (viaje) => {
      const queryKey = ['viajes', sesion?.id] as const
      queryClient.setQueryData<Viaje[]>(queryKey, (actuales) =>
        actuales?.some((actual) => actual.id === viaje.id) ? actuales : [...(actuales ?? []), viaje],
      )
      return queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useActualizarEtapas(viajeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (etapas: Omit<EtapaViaje, 'id'>[]) => viajes.actualizarEtapas(viajeId, etapas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viajes'] }),
  })
}

export function useUnirse() {
  const queryClient = useQueryClient()
  const { data: sesion } = useSesion()
  return useMutation({
    mutationFn: (codigo: string) => viajes.unirse(codigo),
    onSuccess: (viaje) => {
      /*
       * Si a la persona la habían sacado, en caché quedó el "te sacaron" (410) de este viaje. Sin pisarlo, al
       * entrar se mostraría ese aviso viejo mientras se vuelve a pedir, y cerrarlo la mandaba a Mis viajes.
       */
      queryClient.setQueryData(claveDelViaje(sesion?.id, viaje.id), viaje)
      return queryClient.invalidateQueries({ queryKey: ['viajes'] })
    },
  })
}
