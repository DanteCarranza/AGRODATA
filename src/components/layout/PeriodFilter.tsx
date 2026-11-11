import { Link } from 'react-router-dom';
import { CalendarRange, ChevronDown, Lock } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { MESES, cropById } from '@/config/crops';
import { useSesionActiva } from '@/features/sesion/useSesion';
import { periodoActivo, useFiltros } from '@/store/filtros';
import { cn } from '@/lib/format';

const ANIOS = Array.from({ length: 11 }, (_, i) => 2026 - i);

export function resumenPeriodo(anio: number | null, mesIni: number, mesFin: number) {
  const meses = mesIni === 1 && mesFin === 12 ? '' : `${MESES[mesIni - 1]}–${MESES[mesFin - 1]}`;
  if (anio === null && !meses) return 'Todo el histórico';
  return [anio ?? 'Todos los años', meses].filter(Boolean).join(', ');
}

export function PeriodFilter() {
  const { crop, anio, mesIni, mesFin, setPeriodo, limpiarPeriodo } = useFiltros();
  const activo = periodoActivo({ anio, mesIni, mesFin });
  /** primer año que cubre el plan para este cultivo (campañas incluidas o compradas) */
  const desde = useSesionActiva().historial_desde[crop] ?? null;

  return (
    <Popover
      className="w-[320px]"
      trigger={({ abierto, toggle }) => (
        <button
          onClick={toggle}
          aria-expanded={abierto}
          className={cn(
            'crop-tint flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] whitespace-nowrap',
            activo ? 'border-crop bg-crop-soft text-crop-ink' : 'border-line bg-paper text-ink hover:border-faint',
          )}
        >
          <CalendarRange className="size-4" />
          {resumenPeriodo(anio, mesIni, mesFin)}
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      )}
    >
      {(cerrar) => (
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[12.5px] font-medium text-muted">Año</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[null, ...ANIOS].map((a) => {
                const bloqueado = a !== null && desde !== null && a < desde;
                return (
                  <button
                    key={a ?? 'todos'}
                    onClick={() => setPeriodo({ anio: a })}
                    disabled={bloqueado}
                    title={bloqueado ? 'Campaña no incluida en tu plan' : undefined}
                    className={cn(
                      'num flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[12.5px]',
                      anio === a ? 'border-crop bg-crop text-white' : 'border-line hover:border-faint',
                      bloqueado && 'cursor-not-allowed border-dashed text-faint hover:border-line',
                      a === null && 'col-span-4',
                    )}
                  >
                    {bloqueado && <Lock className="size-3" aria-hidden />}
                    {a ?? (desde !== null ? `Todo lo disponible (desde ${desde})` : 'Todos los años')}
                  </button>
                );
              })}
            </div>
            {desde !== null && (
              <p className="mt-2 text-[12px] text-muted">
                Tu plan cubre {cropById(crop).nombre.toLowerCase()} desde {desde}.{' '}
                <Link to={`/suscripcion?cultivo=${crop}`} onClick={cerrar} className="crop-tint font-medium text-crop hover:underline">
                  Ver campañas anteriores
                </Link>
              </p>
            )}
          </div>
          <div>
            <div className="mb-2 text-[12.5px] font-medium text-muted">Meses</div>
            <div className="flex items-center gap-2">
              {(['mesIni', 'mesFin'] as const).map((k, i) => (
                <label key={k} className="flex-1">
                  <span className="sr-only">{i === 0 ? 'Desde' : 'Hasta'}</span>
                  <select
                    value={k === 'mesIni' ? mesIni : mesFin}
                    onChange={(e) => setPeriodo({ [k]: +e.target.value })}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
                  >
                    {MESES.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">Puedes cruzar el año: Oct a Mar cubre una campaña de uva completa.</p>
          </div>
          <div className="flex justify-between border-t border-line pt-3">
            <button onClick={limpiarPeriodo} disabled={!activo} className="text-[13px] text-muted hover:text-ink disabled:opacity-40">
              Ver todo el histórico
            </button>
            <button onClick={cerrar} className="crop-tint rounded-md bg-crop px-3 py-1.5 text-[13px] font-medium text-white">
              Listo
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}