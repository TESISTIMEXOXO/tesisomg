import { Logo } from '../../components/marca/Logo'
import { Pin } from '../../components/marca/Pin'
import type { PinzId } from '../../pinz/elenco'
import { Bajada, Sobretitulo, TituloBanda } from './Banda'
import { useAlVer } from './useAlVer'

const MENSAJES: { quien: string; pinz: PinzId; texto: string; lado: 'izquierda' | 'derecha'; demora: number }[] = [
  { quien: 'Santi', pinz: 'valija', texto: '¿quién reservaba la cabaña al final?', lado: 'izquierda', demora: 0.1 },
  { quien: 'Pedro', pinz: 'vuelto', texto: 'te paso el alias… ¿cuánto era?', lado: 'derecha', demora: 0.25 },
  { quien: 'Tomi', pinz: 'siesta', texto: 'no leí nada, ¿salimos el 14 o el 15?', lado: 'izquierda', demora: 0.4 },
]

/** "¿Les suena?": las burbujas aparecen como mensajes cuando la banda entra en pantalla. */
export function ElProblema() {
  const { ref, visible } = useAlVer<HTMLDivElement>()
  const aparece = visible ? 'motion-safe:animate-sube' : 'motion-safe:opacity-0'

  return (
    <section className="trazo-grueso-t bg-papel">
      <div className="mx-auto flex max-w-310 flex-col gap-14 px-4 py-20 md:px-6 lg:flex-row lg:items-center lg:py-22">
        <div className="flex flex-1 flex-col gap-4">
          <Sobretitulo>El problema</Sobretitulo>
          <TituloBanda>¿Les suena?</TituloBanda>
          <Bajada>Cientos de mensajes, una planilla que nadie actualiza y alguien que termina poniendo de más.</Bajada>
        </div>
        <div ref={ref} className="flex flex-1 flex-col gap-3.5">
          {MENSAJES.map((mensaje) => {
            const derecha = mensaje.lado === 'derecha'
            return (
              <div
                key={mensaje.quien}
                className={`flex items-end gap-2.5 ${derecha ? 'flex-row-reverse self-end' : 'self-start'} ${aparece}`}
                style={{ animationDelay: `${mensaje.demora}s` }}
              >
                <Pin pinz={mensaje.pinz} size={60} label="" />
                <p
                  className={`max-w-90 rounded-lg trazo px-4.5 py-3 text-cuerpo-lg font-semibold shadow-dura ${
                    derecha ? 'rounded-br-sm bg-coral-tinte' : 'rounded-bl-sm bg-papel-elevado'
                  }`}
                >
                  <b>{mensaje.quien}:</b> {mensaje.texto}
                </p>
              </div>
            )
          })}
          <p
            className={`mt-1.5 flex items-center gap-3 self-end rounded-full trazo bg-mar px-5.5 py-2.5 text-cuerpo-lg font-extrabold shadow-dura ${aparece}`}
            style={{ animationDelay: '0.55s' }}
          >
            Tranqui, está todo en <Logo size={26} />
          </p>
        </div>
      </div>
    </section>
  )
}
