import { Check } from 'lucide-react'

type PollOptionProps = {
  label: string
  /** Precio, distancia, quiénes la votaron. */
  detail?: string | null
  votes: number
  /** Personas del grupo. */
  total: number
  /** Si quien usa la app votó esta opción. */
  voted?: boolean
  onVote?: () => void
  disabled?: boolean
}

export function PollOption({ label, detail, votes, total, voted = false, onVote, disabled = false }: PollOptionProps) {
  const porcentaje = total ? Math.round((votes / total) * 100) : 0
  return (
    <button
      type="button"
      aria-pressed={voted}
      onClick={onVote}
      disabled={disabled}
      className={`relative flex min-h-15.5 w-full items-center gap-3 overflow-hidden rounded-md trazo bg-papel-elevado px-4 py-3 text-left text-tinta disabled:cursor-default ${
        voted ? 'shadow-dura' : 'shadow-chica'
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 border-r-2 border-dashed bg-sol-tinte transition-[width] duration-250 ease-rebote motion-reduce:transition-none"
        style={{ width: `${porcentaje}%` }}
      />
      <span
        aria-hidden
        className={`relative grid size-6.5 flex-none place-items-center rounded-full trazo ${voted ? 'tema-claro bg-coral' : 'bg-papel-elevado'}`}
      >
        {voted && <Check size={16} strokeWidth={2} />}
      </span>
      <span className="relative flex flex-1 flex-col">
        <span className="font-extrabold">{label}</span>
        {detail && <span className="text-meta text-tinta-suave">{detail}</span>}
      </span>
      <span className="relative numeros text-etiqueta">
        {votes} {votes === 1 ? 'voto' : 'votos'}
        {voted && <span className="sr-only">, incluye el tuyo</span>}
      </span>
    </button>
  )
}
