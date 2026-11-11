import { Check } from 'lucide-react';
import type { ImportadoresPage, Tendencia } from '@/types/agro';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1 } from '@/lib/format';
import { ESTILO, TENDENCIAS } from '../tendencia';

/** Por país (filtro) y cómo se mueven los importadores frente al periodo anterior (filtro) */
export function ResumenImportadores({
  pagina, pais, tendencia, onPais, onTendencia,
}: {
  pagina: ImportadoresPage;
  pais: string | null;
  tendencia: Tendencia | null;
  onPais: (p: string | null) => void;
  onTendencia: (t: Tendencia | null) => void;
}) {
  const r = pagina.resumen;
  const totalT = r.paises.reduce((s, p) => s + p.t, 0) || 1;
  const paises = r.paises.slice(0, 8);
  const maxShare = Math.max(1, ...paises.map((p) => (p.t / totalT) * 100));
  const cmp = pagina.comparativo;
  const clasificados = TENDENCIAS.reduce((s, t) => s + r.tendencias[t.k], 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Países */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">Dónde compran</h2>
          {pais && <button onClick={() => onPais(null)} className="crop-tint text-[12.5px] text-crop hover:underline">Ver todos</button>}
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted">Parte de las toneladas por país. Elige uno para filtrar.</p>
        <ul className="mt-4 space-y-0.5">
          {paises.map((p) => {
            const on = pais === p.n;
            const share = (p.t / totalT) * 100;
            return (
              <li key={p.n}>
                <button
                  onClick={() => onPais(on ? null : p.n)}
                  aria-pressed={on}
                  className={cn(
                    'crop-tint grid w-full grid-cols-[minmax(0,130px)_1fr_52px] items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] sm:grid-cols-[minmax(0,150px)_1fr_52px_118px]',
                    on ? 'bg-crop-soft' : 'hover:bg-surface',
                  )}
                >
                  <span className={cn('flex min-w-0 items-center gap-2', on && 'font-medium text-crop-ink')}>
                    <Bandera pais={p.n} />
                    <span className="truncate">{nombrePais(p.n)}</span>
                  </span>
                  <span className="h-2 rounded-full bg-surface">
                    <span className="crop-tint block h-full rounded-full bg-crop" style={{ width: `${(share / maxShare) * 100}%` }} />
                  </span>
                  <span className="num text-right font-medium">{fmt1(share)}%</span>
                  <span className="num hidden text-right text-[12px] text-muted sm:block">
                    {fmt(p.importadores)} {p.importadores === 1 ? 'importador' : 'importadores'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Tendencias */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">Cómo se mueven</h2>
          {tendencia && <button onClick={() => onTendencia(null)} className="crop-tint text-[12.5px] text-crop hover:underline">Ver todos</button>}
        </div>
        {cmp ? (
          <>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {cmp.actual} frente a {cmp.anterior}, según su participación en las toneladas.
            </p>

            {clasificados > 0 && (
              <div className="mt-4 flex h-2 gap-[3px] overflow-hidden rounded-full" role="img" aria-label="Reparto de importadores por tendencia">
                {TENDENCIAS.filter((t) => r.tendencias[t.k]).map((t) => (
                  <span
                    key={t.k}
                    className={cn('h-full first:rounded-l-full last:rounded-r-full', ESTILO[t.k].barra, tendencia && tendencia !== t.k && 'opacity-25')}
                    style={{ width: `${(r.tendencias[t.k] / clasificados) * 100}%` }}
                  />
                ))}
              </div>
            )}

            <div role="radiogroup" aria-label="Filtrar por tendencia" className="mt-3 divide-y divide-line">
              {TENDENCIAS.map((t) => {
                const on = tendencia === t.k;
                const e = ESTILO[t.k];
                const Icono = e.icono;
                const v = r.tendencias[t.k];
                return (
                  <button
                    key={t.k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => onTendencia(on ? null : t.k)}
                    className={cn(
                      'crop-tint -mx-2.5 flex w-[calc(100%+20px)] items-center gap-3 rounded-lg px-2.5 py-2 text-left',
                      on ? 'bg-crop-soft' : 'hover:bg-surface',
                      !v && 'opacity-50',
                    )}
                  >
                    <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', e.pill)}>
                      <Icono className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[13px] font-medium', on && 'text-crop-ink')}>{t.titulo}</span>
                      <span className="block truncate text-[12px] text-muted">{t.detalle}</span>
                    </span>
                    {on && <Check className="crop-tint size-4 text-crop" aria-hidden />}
                    <span className="num w-12 text-right font-display text-[20px] leading-none font-semibold">{fmt(v)}</span>
                  </button>
                );
              })}
            </div>
            {r.sin_clasificar > 0 && (
              <p className="mt-2 text-[12px] text-faint">
                {fmt(r.sin_clasificar)} importadores tienen menos de 3 envíos en algún periodo y no se clasifican.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-[13px] text-muted">
            No hay suficientes envíos en el periodo anterior para comparar. Elige otro año o vuelve a todo el histórico.
          </p>
        )}
      </section>
    </div>
  );
}