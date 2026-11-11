import { Fragment } from 'react';
import { Check } from 'lucide-react';
import type { GrupoComparacion, PlanCatalogo, PlanId, ValorComparacion } from '@/types/agro';
import { cn } from '@/lib/format';

function Valor({ v }: { v: ValorComparacion }) {
  if (v === true) return <Check className="mx-auto size-[18px] text-ok" aria-label="Incluido" />;
  if (v === false || v === '–') return <span className="text-faint" aria-label="No incluido">–</span>;
  if (v === 'Vista') return <span className="rounded-full bg-[#fbefe1] px-2 py-0.5 text-[11.5px] font-medium text-[#7a4108]">Solo vista</span>;
  return <span className="text-[12.5px]">{v}</span>;
}

/** Tabla función por función; la columna del plan del cliente queda resaltada */
export function Comparacion({ grupos, planes, actual }: { grupos: GrupoComparacion[]; planes: PlanCatalogo[]; actual: PlanId }) {
  const col = (id: PlanId) => (id === actual ? 'crop-tint bg-crop-soft/60' : '');

  return (
    <section className="min-w-0 rounded-3xl border border-line bg-paper">
      <header className="px-6 pt-5 pb-2">
        <h2 className="font-display text-[18px] font-semibold tracking-tight">Comparación por función</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">El salto de valor está en Profesional: ahí vive la trazabilidad hasta el campo y el balance de saldos.</p>
      </header>
      <div className="scroll-thin overflow-x-auto px-2 pb-3">
        <table className="w-full min-w-[620px] border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Función</th>
              {planes.map((p) => (
                <th key={p.id} className={cn('w-[19%] rounded-t-xl px-4 py-3 text-center font-display text-[14px] font-semibold', col(p.id))}>
                  {p.nombre}
                  {p.id === actual && <span className="crop-tint block text-[11px] font-medium text-crop">tu plan</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g.grupo}>
                <tr>
                  <td colSpan={1} className="px-4 pt-5 pb-2 text-[11.5px] font-semibold tracking-wide text-faint uppercase">{g.grupo}</td>
                  {planes.map((p) => <td key={p.id} className={col(p.id)} />)}
                </tr>
                {g.filas.map((f) => (
                  <tr key={f.funcion}>
                    <td className="border-t border-line px-4 py-2.5">{f.funcion}</td>
                    {planes.map((p) => (
                      <td key={p.id} className={cn('border-t border-line px-4 py-2.5 text-center', col(p.id))}>
                        <Valor v={f.valores[p.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr>
              <td />
              {planes.map((p) => <td key={p.id} className={cn('h-3 rounded-b-xl', col(p.id))} />)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}