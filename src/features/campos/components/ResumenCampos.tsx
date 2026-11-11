import type { CamposPage, Compradores } from '@/types/agro';
import { cn, fmt, titulo } from '@/lib/format';

export const GRUPOS_COMPRADORES: { k: Compradores; titulo: string; detalle: string }[] = [
  { k: 'uno', titulo: 'Un exportador', detalle: 'Venden toda su fruta a una sola empresa' },
  { k: 'pocos', titulo: '2 a 3 exportadores', detalle: 'Reparten entre pocos compradores' },
  { k: 'muchos', titulo: '4 o más', detalle: 'Proveedores abiertos, venden a muchos' },
];

/**
 * Dónde están los campos del filtro y qué tan abiertos están a vender a distintos exportadores.
 * Ambos bloques funcionan también como filtro.
 */
export function ResumenCampos({
  resumen, region, compradores, onRegion, onCompradores,
}: {
  resumen: CamposPage['resumen'];
  region: string | null;
  compradores: Compradores | null;
  onRegion: (r: string | null) => void;
  onCompradores: (c: Compradores | null) => void;
}) {
  const regiones = resumen.regiones.slice(0, 6);
  const maxT = Math.max(1, ...regiones.map((r) => r.t));
  const totalC = resumen.compradores.uno + resumen.compradores.pocos + resumen.compradores.muchos || 1;

  return (
    <section className="grid gap-6 rounded-2xl border border-line bg-paper p-5 lg:grid-cols-2 lg:gap-0">
      <div className="lg:pr-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold">Dónde están</h2>
          <span className="text-[12.5px] text-muted">Toneladas por región</span>
        </div>
        <ul className="mt-3 space-y-1">
          {regiones.map((r) => {
            const on = region === r.n;
            const filtrable = r.n !== 'Sin región';
            return (
              <li key={r.n}>
                <button
                  disabled={!filtrable}
                  onClick={() => onRegion(on ? null : r.n)}
                  className={cn(
                    'crop-tint grid w-full grid-cols-[96px_1fr_auto] items-center gap-3 rounded-md px-2 py-1 text-left text-[13px]',
                    on ? 'bg-crop-soft' : filtrable && 'hover:bg-surface',
                  )}
                >
                  <span className={cn('truncate', on && 'font-medium text-crop-ink', !filtrable && 'text-faint')}>{titulo(r.n)}</span>
                  <span className="h-1.5 rounded-full bg-surface">
                    <span className="crop-tint block h-full rounded-full bg-crop" style={{ width: `${(r.t / maxT) * 100}%` }} />
                  </span>
                  <span className="num text-right whitespace-nowrap text-muted">
                    {fmt(r.campos)} {r.campos === 1 ? 'campo' : 'campos'}, {fmt(r.t)} t
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="lg:border-l lg:border-line lg:pl-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold">A cuántos exportadores venden</h2>
          {compradores && (
            <button onClick={() => onCompradores(null)} className="text-[12.5px] text-crop hover:underline">Ver todos</button>
          )}
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden>
          {GRUPOS_COMPRADORES.map((g, i) => (
            <div
              key={g.k}
              className="crop-tint h-full border-r-2 border-paper last:border-r-0"
              style={{
                width: `${(resumen.compradores[g.k] / totalC) * 100}%`,
                background: `color-mix(in oklab, var(--color-crop) ${100 - i * 30}%, white)`,
              }}
            />
          ))}
        </div>
        <div role="radiogroup" aria-label="Filtrar por cantidad de exportadores" className="mt-3 grid gap-1.5 sm:grid-cols-3">
          {GRUPOS_COMPRADORES.map((g, i) => {
            const on = compradores === g.k;
            return (
              <button
                key={g.k}
                role="radio"
                aria-checked={on}
                onClick={() => onCompradores(on ? null : g.k)}
                className={cn(
                  'crop-tint rounded-lg border p-2.5 text-left',
                  on ? 'border-crop bg-crop-soft' : 'border-line hover:border-faint',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="crop-tint size-2 rounded-full" style={{ background: `color-mix(in oklab, var(--color-crop) ${100 - i * 30}%, white)` }} aria-hidden />
                  <span className={cn('text-[13px] font-medium', on && 'text-crop-ink')}>{g.titulo}</span>
                </div>
                <div className="num mt-1 font-display text-[20px] leading-none font-semibold">{fmt(resumen.compradores[g.k])}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-muted">{g.detalle}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}