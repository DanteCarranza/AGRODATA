import { useMemo, useState } from 'react';
import type { CeldaCalendario, Periodo } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { mesEnRango } from '@/store/filtros';
import { cn, fmt, fmt1 } from '@/lib/format';

/**
 * Mapa de calor años × meses: muestra cuándo sale la fruta y cómo cambia la campaña año a año.
 * La intensidad usa raíz cuadrada para que los meses pequeños no desaparezcan.
 */
export function CalendarioCampana({
  celdas,
  anios,
  periodo,
  onElegirAnio,
}: {
  celdas: CeldaCalendario[];
  anios: number[];
  periodo: Periodo;
  onElegirAnio: (a: number | null) => void;
}) {
  const [hover, setHover] = useState<CeldaCalendario | null>(null);

  const { mapa, max, totales, maxTotal, pico } = useMemo(() => {
    const mapa = new Map(celdas.map((c) => [`${c.anio}-${c.mes}`, c]));
    const max = Math.max(1, ...celdas.map((c) => c.t));
    const totales = new Map<number, number>();
    const porMes = Array(12).fill(0);
    celdas.forEach((c) => {
      totales.set(c.anio, (totales.get(c.anio) ?? 0) + c.t);
      porMes[c.mes - 1] += c.t;
    });
    const pico = porMes.indexOf(Math.max(...porMes));
    return { mapa, max, totales, maxTotal: Math.max(1, ...totales.values()), pico };
  }, [celdas]);

  const filas = [...anios].sort((a, b) => b - a);

  return (
    <div>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[640px] border-separate border-spacing-[3px]">
          <thead>
            <tr>
              <th className="w-14" />
              {MESES.map((m, i) => (
                <th
                  key={m}
                  scope="col"
                  className={cn('pb-1 text-center text-[12px] font-normal', i === pico ? 'font-semibold text-crop' : 'text-muted')}
                >
                  {m}
                </th>
              ))}
              <th className="w-32 pb-1 pl-3 text-left text-[12px] font-normal text-muted">Total (t)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((a) => {
              const anioOn = periodo.anio === null || periodo.anio === a;
              const tot = totales.get(a) ?? 0;
              return (
                <tr key={a}>
                  <th scope="row" className="pr-2 text-right">
                    <button
                      onClick={() => onElegirAnio(periodo.anio === a ? null : a)}
                      className={cn(
                        'num rounded px-1 text-[12.5px]',
                        periodo.anio === a ? 'font-semibold text-crop' : 'font-normal text-muted hover:text-ink',
                      )}
                      title={periodo.anio === a ? 'Quitar filtro de año' : `Filtrar ${a}`}
                    >
                      {a}
                    </button>
                  </th>
                  {MESES.map((_, i) => {
                    const c = mapa.get(`${a}-${i + 1}`);
                    const on = anioOn && mesEnRango(i + 1, periodo);
                    const alpha = c ? 0.12 + 0.88 * Math.sqrt(c.t / max) : 0;
                    return (
                      <td key={i} className="p-0">
                        <div
                          onMouseEnter={() => c && setHover(c)}
                          onMouseLeave={() => setHover(null)}
                          className={cn('crop-tint h-7 rounded-[5px]', !on && 'opacity-25', !c && 'bg-surface')}
                          style={c ? { background: `color-mix(in oklab, var(--color-crop) ${Math.round(alpha * 100)}%, white)` } : undefined}
                          aria-label={c ? `${MESES_LARGO[i]} ${a}: ${fmt(c.t)} t` : `${MESES_LARGO[i]} ${a}: sin envíos`}
                        />
                      </td>
                    );
                  })}
                  <td className="pl-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-surface">
                        <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(tot / maxTotal) * 100}%`, opacity: anioOn ? 1 : 0.3 }} />
                      </div>
                      <span className="num w-12 text-right text-[12px] text-muted">{fmt(tot)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 h-5 text-[13px] text-muted" aria-live="polite">
        {hover ? (
          <>
            <span className="font-medium text-ink">{MESES_LARGO[hover.mes - 1]} {hover.anio}</span>: {fmt1(hover.t)} t en {fmt(hover.envios)} envíos
          </>
        ) : (
          <>El mes más fuerte del histórico es <span className="font-medium text-crop">{MESES_LARGO[pico].toLowerCase()}</span>. Pasa el cursor por una celda para ver el detalle o haz clic en un año para filtrarlo.</>
        )}
      </p>
    </div>
  );
}