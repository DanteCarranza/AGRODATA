import { useState } from 'react';
import type { Conteo } from '@/types/agro';
import { Delta } from '@/components/ui/Delta';
import { cn, fmt, titulo } from '@/lib/format';

export function Destinos({
  destinos,
  activo,
  onElegir,
}: {
  destinos: Conteo[];
  activo: string | null;
  onElegir: (d: string | null) => void;
}) {
  const [todos, setTodos] = useState(false);
  const total = destinos.reduce((s, d) => s + d.envios, 0) || 1;
  const max = destinos[0]?.envios || 1;
  const lista = todos ? destinos : destinos.slice(0, 10);
  const conCambio = destinos.some((d) => d.delta_pp !== null && d.delta_pp !== undefined);

  if (!destinos.length) return <p className="py-6 text-[13px] text-muted">No hay envíos en este periodo. Amplía los meses o elige todos los años.</p>;

  return (
    <div>
      <div className="mb-1 flex justify-end gap-3 px-2.5 text-[11.5px] text-muted">
        <span className="w-14 text-right">Envíos</span>
        <span className="w-12 text-right">Part.</span>
        {conCambio && <span className="w-12 text-right" title="Cambio de participación en puntos frente al periodo anterior">Cambio</span>}
      </div>
      <ul className="space-y-0.5">
        {lista.map((d) => {
          const on = d.n === activo;
          return (
            <li key={d.n}>
              <button
                onClick={() => onElegir(on ? null : d.n)}
                aria-pressed={on}
                className={cn('crop-tint group w-full rounded-lg px-2.5 py-2 text-left', on ? 'bg-crop-soft' : 'hover:bg-surface')}
              >
                <div className="flex items-baseline gap-3 text-[13.5px]">
                  <span className={cn('min-w-0 flex-1 truncate', on && 'font-medium text-crop-ink')}>{titulo(d.n)}</span>
                  <span className="num w-14 shrink-0 text-right text-muted">{fmt(d.envios)}</span>
                  <span className="num w-12 shrink-0 text-right text-faint">{((d.envios / total) * 100).toFixed(1)}%</span>
                  {conCambio && (
                    <span className="w-12 shrink-0 text-right"><Delta pp={d.delta_pp} /></span>
                  )}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface">
                  <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(d.envios / max) * 100}%` }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {destinos.length > 10 && (
        <button onClick={() => setTodos((v) => !v)} className="mt-3 px-2.5 text-[13px] font-medium text-crop hover:underline">
          {todos ? 'Ver solo los 10 principales' : `Ver los ${destinos.length} destinos`}
        </button>
      )}
    </div>
  );
}