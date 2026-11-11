import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { BalanceData, EstadoSaldo } from '@/types/agro';
import { cn, fmt, fmt1, fmtCorto } from '@/lib/format';
import { ESTADO_SALDO, ORDEN_ESTADOS } from '../estado';

const PUNTO: Record<EstadoSaldo, string> = { alto: 'bg-[#6fd29a]', uso: 'bg-white', agotado: 'bg-[#f2b056]', sobregiro: 'bg-[#ff8a75]' };

/**
 * Cabecera oscura: cuánta fruta certificada queda sin embarcar y el semáforo de los certificados.
 * Los cuatro estados filtran la lista.
 */
export function HeroBalance({
  data, cultivo, estado, onEstado,
}: {
  data: BalanceData;
  cultivo: string;
  estado: EstadoSaldo | null;
  onEstado: (e: EstadoSaldo | null) => void;
}) {
  const r = data.resumen;
  const usado = r.certificado_t ? (r.embarcado_t / r.certificado_t) * 100 : 0;
  const sobregiros = r.estados.sobregiro;

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
      <div className="grid gap-10 p-6 sm:p-8 xl:grid-cols-[minmax(300px,1fr)_1.1fr]">
        <div>
          <p className="text-[12.5px] text-white/60">Fruta certificada que todavía no se embarca</p>
          <div className="num mt-3 font-display text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] text-mint">
            {fmtCorto(r.saldo_t)}<span className="ml-2 text-[30px]">t</span>
          </div>
          <p className="mt-3 max-w-[40ch] text-[14px] leading-snug text-white/80">
            de {fmt(r.certificado_t)} t que certificaron {fmt(r.campos)} campos de {cultivo.toLowerCase()} en la campaña {data.campana}.
            Ya se embarcó el {fmt1(usado)}%.
          </p>

          <div className="mt-6 flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={`Embarcado ${fmt1(usado)}% del certificado`}>
            <span className="h-full rounded-l-full bg-mint" style={{ width: `${Math.max(1, Math.min(usado, 100))}%` }} />
            <span className="h-full flex-1 rounded-r-full bg-white/12" />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            {[
              { l: 'Certificado', v: `${fmt(r.certificado_t)} t`, c: 'bg-white/30' },
              { l: 'Embarcado', v: `${fmt(r.embarcado_t)} t`, c: 'bg-mint' },
              { l: 'Saldo', v: `${fmt(r.saldo_t)} t`, c: 'bg-white/15' },
            ].map((x) => (
              <div key={x.l}>
                <dt className="flex items-center gap-1.5 text-white/55">
                  <span className={cn('size-2 rounded-full', x.c)} aria-hidden />
                  {x.l}
                </dt>
                <dd className="num mt-0.5 pl-3.5 font-medium text-white">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-white/60">Semáforo de los certificados</p>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-medium',
                sobregiros ? 'bg-[#ff8a75]/15 text-[#ffb3a5]' : 'bg-mint/15 text-mint',
              )}
            >
              {sobregiros ? <ShieldAlert className="size-4" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
              {sobregiros ? `${fmt(sobregiros)} ${sobregiros === 1 ? 'sobregiro' : 'sobregiros'} por revisar` : 'Sin sobregiros'}
            </span>
          </div>
          <div role="radiogroup" aria-label="Filtrar por estado del certificado" className="mt-4 grid grid-cols-2 gap-3">
            {ORDEN_ESTADOS.map((k) => {
              const e = ESTADO_SALDO[k];
              const on = estado === k;
              const n = r.estados[k];
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  onClick={() => onEstado(on ? null : k)}
                  className={cn(
                    'rounded-2xl p-4 text-left ring-1 transition-colors',
                    on ? 'bg-white/[0.14] ring-mint/50' : 'bg-white/[0.05] ring-white/10 hover:bg-white/[0.09]',
                    !n && !on && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <span className={cn('size-2.5 rounded-full', PUNTO[k])} aria-hidden />
                    {e.titulo}
                  </div>
                  <div className="num mt-3 font-display text-[34px] leading-none font-semibold">{fmt(n)}</div>
                  <div className="mt-1.5 text-[12px] text-white/55">
                    {n === 1 ? 'campo' : 'campos'} con {e.rango} usado
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}