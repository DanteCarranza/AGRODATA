import { useMemo, useState } from 'react';
import { ArrowDown, Route } from 'lucide-react';
import type { Eslabon, EstadoTraza, TrazaExportador } from '@/types/agro';
import { COLOR_TRAZA } from '@/features/envios/traza';
import { cn, fmt, titulo } from '@/lib/format';

type Orden = 't' | 'completa' | 'sin';
const ORDENES: { k: Orden; l: string }[] = [
  { k: 't', l: 'Más toneladas' },
  { k: 'completa', l: 'Más trazables' },
  { k: 'sin', l: 'Menos trazables' },
];
const ESTADOS: EstadoTraza[] = ['completa', 'parcial', 'sin'];
const INICIAL = 12;
/** Con muy pocos envíos el % no dice mucho: se ordena por trazabilidad solo a quien tenga al menos 5 */
const MIN_ENVIOS = 5;

/** Qué tan trazable es lo que embarca cada exportador */
export function TablaTrazaExportadores({ filas, onElegir }: { filas: TrazaExportador[]; onElegir: (tipo: Eslabon, n: string) => void }) {
  const [orden, setOrden] = useState<Orden>('t');
  const [todos, setTodos] = useState(false);

  const ordenadas = useMemo(() => {
    if (orden === 't') return filas;
    return filas.filter((f) => f.envios >= MIN_ENVIOS).sort((a, b) => b[orden] - a[orden] || b.t - a.t);
  }, [filas, orden]);
  const visibles = todos ? ordenadas : ordenadas.slice(0, INICIAL);

  return (
    <section className="rounded-2xl border border-line bg-paper">
      <header className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5 pb-3">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight">Exportadores según su trazabilidad</h2>
          <p className="mt-1 text-[13px] text-muted">Qué parte de lo que embarca cada uno se puede respaldar con sus campos.</p>
        </div>
        <div role="radiogroup" aria-label="Ordenar" className="flex rounded-lg border border-line p-0.5 text-[12.5px]">
          {ORDENES.map((o) => (
            <button
              key={o.k}
              role="radio"
              aria-checked={orden === o.k}
              onClick={() => setOrden(o.k)}
              className={cn('crop-tint rounded-md px-3 py-1.5', orden === o.k ? 'bg-crop text-white' : 'text-muted hover:text-ink')}
            >
              {o.l}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pb-3 text-[12px] text-muted">
        {ESTADOS.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', COLOR_TRAZA[k].barra, k === 'sin' && 'opacity-60')} aria-hidden />
            {k === 'completa' ? 'Origen completo' : k === 'parcial' ? 'Origen parcial' : 'Sin campo'}
          </span>
        ))}
        {orden !== 't' && <span className="text-faint">Solo exportadores con {MIN_ENVIOS} envíos o más.</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-y border-line text-left text-[12px] text-muted">
              <th className="w-12 py-2.5 pl-5 font-normal">#</th>
              <th className="py-2.5 font-normal">Exportador</th>
              <th className="w-[34%] py-2.5 font-normal">Origen del peso embarcado</th>
              <th className="py-2.5 text-right font-normal">Toneladas</th>
              <th className="py-2.5 text-right font-normal">Campos</th>
              <th className="py-2.5 text-right font-normal">Plantas</th>
              <th className="w-24 py-2.5 pr-5" />
            </tr>
          </thead>
          <tbody>
            {visibles.map((f, i) => (
              <tr key={f.n} className="group border-b border-line last:border-b-0 hover:bg-surface/60">
                <td className="num py-3 pl-5 text-faint">{i + 1}</td>
                <td className="max-w-0 py-3 pr-4">
                  <div className="truncate font-medium" title={titulo(f.n)}>{titulo(f.n)}</div>
                  <div className="num text-[12px] text-muted">{fmt(f.envios)} {f.envios === 1 ? 'envío' : 'envíos'}</div>
                </td>
                <td className="py-3 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-2.5 flex-1 gap-[2px] overflow-hidden rounded-full bg-surface">
                      {ESTADOS.map((k) =>
                        f[k] > 0 ? (
                          <span
                            key={k}
                            title={`${k === 'completa' ? 'Completo' : k === 'parcial' ? 'Parcial' : 'Sin campo'}: ${Math.round(f[k])}%`}
                            className={cn('h-full', COLOR_TRAZA[k].barra, k === 'sin' && 'opacity-50')}
                            style={{ width: `${f[k]}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                    <span className={cn('num w-11 text-right text-[12.5px] font-semibold', f.completa >= 80 ? 'text-ok' : f.completa >= 40 ? 'text-ink' : 'text-warn')}>
                      {Math.round(f.completa)}%
                    </span>
                  </div>
                </td>
                <td className="num py-3 text-right font-medium">{fmt(f.t)}</td>
                <td className="num py-3 text-right text-muted">{fmt(f.campos)}</td>
                <td className="num py-3 text-right text-muted">{fmt(f.plantas)}</td>
                <td className="py-3 pr-5 text-right">
                  <button
                    onClick={() => onElegir('exportador', f.n)}
                    className="crop-tint inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] text-crop opacity-70 group-hover:bg-crop-soft group-hover:opacity-100"
                  >
                    <Route className="size-3.5" aria-hidden /> Seguir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordenadas.length > INICIAL && (
        <div className="border-t border-line px-5 py-3">
          <button onClick={() => setTodos(!todos)} className="crop-tint inline-flex items-center gap-1.5 text-[13px] font-medium text-crop hover:underline">
            <ArrowDown className={cn('size-4 transition-transform', todos && 'rotate-180')} />
            {todos ? 'Ver menos' : `Ver los ${fmt(ordenadas.length)} exportadores`}
          </button>
        </div>
      )}
    </section>
  );
}