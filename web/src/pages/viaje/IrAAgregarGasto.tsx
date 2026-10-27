import { Plus } from 'lucide-react'
import { ButtonLink } from '../../components/ui/Button'
import type { Persona } from '../../types/persona'
import { puedeEditar } from './nombres'

/** El atajo al formulario de Cuentas desde cualquier lugar donde se ven los saldos. Los lectores no lo ven. */
export function IrAAgregarGasto({ viajeId, personas }: { viajeId: string; personas: Persona[] }) {
  if (!puedeEditar(personas)) return null
  return (
    <ButtonLink to={`/viajes/${viajeId}/cuentas#nuevo-gasto`} variant="secundario" size="sm" icon={Plus} className="self-start">
      Agregar gasto
    </ButtonLink>
  )
}
