import type { EnviosPage, EstadoTraza } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { cn, fmt } from '@/lib/format';
import { COLOR_TRAZA, ETIQUETA_TRAZA } from '../traza';

const ESTADOS: EstadoTraza[] = ['completa', 'parcial', 'sin'];

/**
 * Franja bajo el encabezado: cuánto del filtro está respaldado por campos (y filtro rápido por estado)
 * y en qué meses sale la fruta del conjunto filtrado.
 */
export function ResumenEnvios({
  resumen, traza, onTraza,
}: {
  resumen: EnviosPage['resumen'];
  traza: EstadoTraza | null;
  onTraza: (t: EstadoTraza | null) => void;
}) {
  const total = ESTADOS.reduce((s, k) => s + resumen.traza[k], 0) || 1;
  const maxMes = Math.max(1, ...resumen.por_mes);
  const pico = resumen.por_mes.indexOf(Math.max(...resumen.por_mes));

  return (
    <section className="grid gap-6 rounded-2xl border border-line bg-paper p-5 lg:grid-cols-[1.4fr_1fr] lg:gap-0">
      <div className="lg:pr-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold">Trazabilidad de los envíos</h2>
          <span className="num text-[12.5px] text-muted">
            {fmt((resumen.traza.completa / total) * 100)}% con respaldo completo
          </span>
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface" role="img" aria-label="Proporción de envíos por estado de trazabilidad">
          {ESTADOS.map((k) => (
            <div key={k} className={cn('h-full', COLOR_TRAZA[k].barra, k === 'sin' && 'opacity-50')} style={{ width: `${(resumen.traza[k] / total) * 100}%` }} />
          ))}
        </div>
        <div role="radiogroup" aria-label="Filtrar por trazabilidad" className="mt-4 flex flex-wrap gap-1.5">
          {[null, ...ESTADOS].map((k) => {
            const on = traza === k;
            const n = k ? resumen.traza[k] : total;
            return (
              <button
                key={k ?? 'todos'}
                role="radio"
                aria-checked={on}
                onClick={() => onTraza(k)}
                className={cn(
                  'crop-tint flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px]',
                  on ? 'border-crop bg-crop-soft font-medium text-crop-ink' : 'border-line hover:border-faint',
                )}
              >
                {k && <span className={cn('size-2 rounded-full', COLOR_TRAZA[k].barra, k === 'sin' && 'opacity-60')} aria-hidden />}
                {k ? ETIQUETA_TRAZA[k] : 'Todos'}
                <span className="num text-muted">{fmt(n)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:border-l lg:border-line lg:pl-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold">Cuándo sale la fruta</h2>
          {resumen.por_mes.some(Boolean) && (
            <span className="text-[12.5px] text-muted">Pico en {MESES_LARGO[pico].toLowerCase()}</span>
          )}
        </div>
        <div className="mt-3 flex h-16 items-end gap-1">
          {resumen.por_mes.map((t, i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${MESES_LARGO[i]}: ${fmt(t)} t`}>
              <div
                className={cn('crop-tint rounded-t-[3px]', i === pico ? 'bg-crop' : 'bg-crop/45')}
                style={{ height: `${(t / maxMes) * 100}%`, minHeight: t ? 3 : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {MESES.map((m, i) => (
            <span key={m} className={cn('flex-1 text-center text-[10.5px]', i === pico ? 'font-semibold text-crop' : 'text-muted')}>
              {m.charAt(0)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}