import { ArrowUpRight } from 'lucide-react';
import type { ImportadoresPage } from '@/types/agro';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { MiniMeses } from '@/components/ui/MiniMeses';
import { rangoTemporada } from '@/lib/temporada';
import { cn, fmt, fmt1, titulo } from '@/lib/format';

/**
 * Cabecera oscura: cuánto concentran los 10 primeros y las fichas de los 3 que más compran.
 * El brillo de fondo toma el color del cultivo activo.
 */
export function PodioImportadores({
  pagina, cultivo, onAbrir,
}: {
  pagina: ImportadoresPage;
  cultivo: string;
  onAbrir: (n: string) => void;
}) {
  const { top, top10 } = pagina.resumen;
  const n = top10.length;
  const conc = top10.reduce((s, v) => s + v, 0);
  const top3 = top10.slice(0, 3).reduce((s, v) => s + v, 0);

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-forest text-white">
      <div
        aria-hidden
        className="crop-tint absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            'radial-gradient(700px 320px at 92% -10%, color-mix(in oklab, var(--color-crop) 55%, transparent), transparent 70%),' +
            'radial-gradient(500px 260px at -5% 110%, color-mix(in oklab, var(--color-mint) 14%, transparent), transparent 70%)',
        }}
      />
      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(260px,0.85fr)_2.15fr] xl:gap-10">
        {/* Concentración */}
        <div className="flex flex-col">
          <p className="text-[12.5px] text-white/60">Qué tan concentrado está el mercado</p>
          <div className="num mt-3 font-display text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] text-mint">
            {fmt1(conc)}<span className="text-[36px]">%</span>
          </div>
          <p className="mt-3 max-w-[30ch] text-[14px] leading-snug text-white/80">
            {n < 10
              ? `de las compras de ${cultivo.toLowerCase()} lo hacen estos ${n} importadores.`
              : `de las compras de ${cultivo.toLowerCase()} lo hacen los 10 primeros, de ${fmt(pagina.total)} importadores.`}
          </p>

          <div className="mt-6 flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={`Los 10 primeros suman ${fmt1(conc)}%`}>
            <span className="h-full rounded-l-full bg-mint" style={{ width: `${Math.max(1.5, top3)}%` }} />
            <span className="h-full bg-mint/45" style={{ width: `${Math.max(1.5, conc - top3)}%` }} />
            <span className="h-full flex-1 rounded-r-full bg-white/12" />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            {[
              { l: 'Top 3', v: top3, c: 'bg-mint' },
              { l: 'Del 4 al 10', v: conc - top3, c: 'bg-mint/45' },
              { l: 'El resto', v: 100 - conc, c: 'bg-white/25' },
            ].map((x) => (
              <div key={x.l}>
                <dt className="flex items-center gap-1.5 whitespace-nowrap text-white/55">
                  <span className={cn('size-2 rounded-full', x.c)} aria-hidden />
                  {x.l}
                </dt>
                <dd className="num mt-0.5 pl-3.5 font-medium text-white">{fmt1(x.v)}%</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Podio */}
        <div>
          <p className="text-[12.5px] text-white/60">Los que más compran</p>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {top.map((f, i) => (
              <li key={f.n}>
                <button
                  onClick={() => onAbrir(f.n)}
                  className={cn(
                    'group flex h-full w-full flex-col rounded-2xl p-4 text-left ring-1 transition-colors',
                    i === 0 ? 'bg-white/[0.10] ring-mint/35 hover:bg-white/[0.14]' : 'bg-white/[0.05] ring-white/10 hover:bg-white/[0.09]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('num font-display text-[40px] leading-none font-semibold tracking-tight', i === 0 ? 'text-mint' : 'text-white/35')}>
                      {i + 1}
                    </span>
                    <ArrowUpRight className="size-4 text-white/30 transition-colors group-hover:text-mint" aria-hidden />
                  </div>
                  <div className="mt-3 line-clamp-2 min-h-[2.6em] text-[14.5px] leading-tight font-medium" title={titulo(f.n)}>
                    {titulo(f.n)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/60">
                    <Bandera pais={f.pais} />
                    {nombrePais(f.pais)}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="num font-display text-[26px] leading-none font-semibold tracking-tight">{fmt(f.t)}</span>
                    <span className="text-[12.5px] text-white/60">t</span>
                    <span className="num ml-auto text-[12.5px] text-white/60">{fmt1(f.share)}%</span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-white/45">Compra en</div>
                      <div className="text-[12.5px] font-medium text-white/90">{rangoTemporada(f.meses)}</div>
                    </div>
                    <MiniMeses meses={f.meses} tono="menta" />
                  </div>
                  {f.variedad && (
                    <div className="mt-2 truncate text-[12px] text-white/60">
                      Sobre todo <span className="text-white/90">{titulo(f.variedad)}</span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}