import type { TrazabilidadData } from '@/types/agro';
import { cn, fmt, fmt1 } from '@/lib/format';

const ESTADOS = [
  { k: 'completa', l: 'Origen completo', c: 'bg-mint' },
  { k: 'parcial', l: 'Origen parcial', c: 'bg-mint/45' },
  { k: 'sin', l: 'Sin campo', c: 'bg-white/15' },
] as const;

/**
 * Cabecera oscura: qué parte del peso se puede rastrear hasta el campo, y cómo cambió año a año.
 * El brillo de fondo toma el color del cultivo activo.
 */
export function HeroTraza({ data, anio, cultivo }: { data: TrazabilidadData; anio: number | null; cultivo: string }) {
  const r = data.resumen;
  const total = r.peso_t || 1;
  const pct = (t: number) => (t / total) * 100;
  const completa = pct(r.estados.completa.t);
  const anios = data.por_anio.slice(-10);

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-forest text-white">
      <div
        aria-hidden
        className="crop-tint absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            'radial-gradient(700px 320px at 95% -10%, color-mix(in oklab, var(--color-crop) 55%, transparent), transparent 70%),' +
            'radial-gradient(500px 260px at -5% 110%, color-mix(in oklab, var(--color-mint) 14%, transparent), transparent 70%)',
        }}
      />
      <div className="grid gap-10 p-6 sm:p-8 xl:grid-cols-[minmax(300px,1fr)_1.25fr]">
        <div>
          <p className="text-[12.5px] text-white/60">Fruta que se puede rastrear hasta el campo</p>
          <div className="num mt-3 font-display text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] text-mint">
            {fmt1(completa)}<span className="text-[36px]">%</span>
          </div>
          <p className="mt-3 max-w-[38ch] text-[14px] leading-snug text-white/80">
            del peso de {cultivo.toLowerCase()} embarcado está respaldado por completo por campos certificados.
          </p>

          <div className="mt-6 flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label="Reparto del peso por estado de trazabilidad">
            {ESTADOS.map((e) => {
              const v = pct(r.estados[e.k].t);
              return v > 0 ? <span key={e.k} className={cn('h-full first:rounded-l-full last:rounded-r-full', e.c)} style={{ width: `${v}%` }} /> : null;
            })}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            {ESTADOS.map((e) => (
              <div key={e.k}>
                <dt className="flex items-center gap-1.5 whitespace-nowrap text-white/55">
                  <span className={cn('size-2 rounded-full', e.c === 'bg-white/15' ? 'bg-white/30' : e.c)} aria-hidden />
                  {e.l}
                </dt>
                <dd className="num mt-0.5 pl-3.5 font-medium text-white">{fmt1(pct(r.estados[e.k].t))}%</dd>
                <dd className="num pl-3.5 text-white/45">{fmt(r.estados[e.k].envios)} envíos</dd>
              </div>
            ))}
          </dl>

          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            {[
              { v: fmt(r.campos), l: 'campos enlazados' },
              { v: fmt(r.plantas), l: 'plantas de empaque' },
              { v: fmt(r.respaldado_t), l: 't con campo' },
            ].map((x) => (
              <div key={x.l}>
                <dd className="num font-display text-[22px] leading-none font-semibold">{x.v}</dd>
                <dt className="mt-1 text-[12px] text-white/55">{x.l}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col">
          <p className="text-[12.5px] text-white/60">Año a año, % del peso con origen completo</p>
          <div className="mt-4 flex min-h-[200px] flex-1 items-end gap-2">
            {anios.map((a) => {
              const activo = anio === a.anio;
              return (
                <div key={a.anio} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${a.anio}: ${fmt1(a.completa)}% completa, ${fmt1(a.parcial)}% parcial, ${fmt1(a.sin)}% sin campo`}>
                  <span className={cn('num text-[11.5px]', activo ? 'font-semibold text-mint' : 'text-white/70')}>{Math.round(a.completa)}%</span>
                  <div className={cn('flex h-[170px] w-full max-w-[38px] flex-col-reverse overflow-hidden rounded-md', activo && 'ring-2 ring-mint/70 ring-offset-2 ring-offset-forest')}>
                    <span className="bg-mint" style={{ height: `${a.completa}%` }} />
                    <span className="border-t border-forest bg-mint/45" style={{ height: `${a.parcial}%` }} />
                    <span className="border-t border-forest bg-white/12" style={{ height: `${a.sin}%` }} />
                  </div>
                  <span className={cn('num text-[11px]', activo ? 'font-semibold text-white' : 'text-white/50')}>{a.anio}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[12px] text-white/45">
            Origen completo: los campos declarados cubren todo el peso embarcado (con 1% de tolerancia). Parcial: cubren solo una parte.
          </p>
        </div>
      </div>
    </section>
  );
}