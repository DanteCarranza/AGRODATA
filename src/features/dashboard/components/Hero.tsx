import { X } from 'lucide-react';
import { MESES_LARGO, type CropDef } from '@/config/crops';
import type { DashboardData } from '@/types/agro';
import { fmt, titulo } from '@/lib/format';
import { Skeleton } from '@/components/ui/Panel';

function AnilloTraza({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const estado = pct > 50 ? 'Alta' : pct > 25 ? 'Media' : 'Baja';
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 84 84" className="size-[84px] -rotate-90" aria-hidden>
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--color-crop-soft)" strokeWidth="9" />
        <circle
          className="crop-tint"
          cx="42" cy="42" r={r} fill="none" stroke="var(--color-crop)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="leading-tight">
        <div className="num font-display text-[26px] font-semibold tracking-tight">{pct.toLocaleString('es-PE')}%</div>
        <div className="text-[12.5px] text-muted">del peso enlazado</div>
        <div className="text-[12.5px] text-muted">a campo certificado ({estado.toLowerCase()})</div>
      </div>
    </div>
  );
}

export function Hero({
  crop,
  data,
  periodo,
  destino,
  onQuitarDestino,
}: {
  crop: CropDef;
  data?: DashboardData;
  periodo: string;
  destino: string | null;
  onQuitarDestino: () => void;
}) {
  const k = data?.kpis;
  const kpis = k
    ? [
        { v: fmt(k.envios), l: 'envíos' },
        { v: fmt(k.peso_t), l: 'toneladas netas' },
        { v: fmt(k.campos), l: 'campos certificados' },
        { v: fmt(k.destinos), l: k.destinos === 1 ? 'destino' : 'destinos' },
      ]
    : [];

  return (
    <section className="relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">
            Campaña típica en Perú: {crop.campana}. Mostrando {periodo.toLowerCase()}.
            {data && (
              <> Datos actualizados hasta {MESES_LARGO[data.datos_hasta.mes - 1].toLowerCase()} de {data.datos_hasta.anio}.</>
            )}
          </p>
          <h1 className="crop-tint mt-1 font-display text-[44px] leading-[1.02] font-semibold tracking-[-0.03em] text-crop sm:text-[64px]">
            {crop.nombre}
          </h1>
          {destino && (
            <button
              onClick={onQuitarDestino}
              className="crop-tint mt-3 inline-flex items-center gap-2 rounded-full bg-crop-soft py-1 pr-2 pl-3 text-[13px] text-crop-ink hover:brightness-95"
            >
              Solo envíos a {titulo(destino)}
              <X className="size-3.5" aria-label="Quitar destino" />
            </button>
          )}
        </div>
        {k && <AnilloTraza pct={k.traza_pct} />}
      </div>

      <dl className="mt-7 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {(kpis.length ? kpis : Array.from({ length: 4 }, () => null)).map((x, i) => (
          <div key={i} className={`py-4 ${i % 2 ? 'pl-5' : 'sm:pl-0'} ${i > 0 ? 'sm:border-l sm:border-line sm:pl-5' : ''} ${i >= 2 ? 'border-t border-line sm:border-t-0' : ''}`}>
            {x ? (
              <>
                <dd className="num font-display text-[28px] leading-none font-semibold tracking-tight">{x.v}</dd>
                <dt className="mt-1.5 text-[13px] text-muted">{x.l}</dt>
              </>
            ) : (
              <>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="mt-2 h-3.5 w-20" />
              </>
            )}
          </div>
        ))}
      </dl>
      {data?.muestra && (
        <p className="mt-2 text-[12.5px] text-muted">
          Con filtros activos, las cifras se calculan sobre la muestra de envíos cargada, no sobre el total oficial.
        </p>
      )}
    </section>
  );
}