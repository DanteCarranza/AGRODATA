import { CheckCircle2, Clock, Loader2, Lock, Radio, Unlock, Plus } from 'lucide-react';
import type { CampanaHistorica, CropId, EstadoCampana, SuscripcionData } from '@/types/agro';
import { CROPS } from '@/config/crops';
import { cn, fmt } from '@/lib/format';

const ESTADO: Record<EstadoCampana, { l: string; Icon: typeof Lock; c: string }> = {
  en_curso: { l: 'En curso, incluida', Icon: Radio, c: 'bg-[#e8f1ec] text-[#14513a]' },
  incluida: { l: 'Incluida en tu plan', Icon: CheckCircle2, c: 'bg-[#e8f1ec] text-[#14513a]' },
  desbloqueada: { l: 'Comprada', Icon: Unlock, c: 'bg-[#e9eef6] text-[#24406b]' },
  solicitada: { l: 'Pedido en proceso', Icon: Clock, c: 'bg-[#fbefe1] text-[#7a4108]' },
  bloqueada: { l: 'Bloqueada', Icon: Lock, c: 'bg-surface text-muted' },
};

/** Temporada en curso + campañas cerradas de cada cultivo: qué trae el plan y qué se compra aparte */
export function Campanas({
  data, cultivo, contratados, onCultivo, cargando, onPedir, onAgregarCultivo, pendiente,
}: {
  data: SuscripcionData['campanas'];
  cultivo: string;
  contratados: CropId[];
  onCultivo: (c: CropId) => void;
  cargando: boolean;
  onPedir: (c: CampanaHistorica) => void;
  onAgregarCultivo: () => void;
  /** id de la campaña que se está pidiendo, o 'cultivo' */
  pendiente: string | null;
}) {
  return (
    <section id="campanas" className="min-w-0 scroll-mt-24 rounded-3xl border border-line bg-paper">
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-3">
        <div className="max-w-2xl">
          <h2 className="font-display text-[18px] font-semibold tracking-tight">Campañas por cultivo</h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            Tu suscripción trae la temporada en curso y lo nuevo que llegue. Las campañas cerradas se compran una sola vez y quedan en tu
            cuenta: rankings, tendencias y campos se recalculan con esa data.
          </p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-[11.5px] font-medium', data.ventana_estimada ? 'bg-[#fbefe1] text-[#7a4108]' : 'bg-[#e8f1ec] text-[#14513a]')}>
          Campaña de {data.ventana} · {data.ventana_estimada ? 'ventana estimada' : 'ventana confirmada'}
        </span>
      </header>

      <div role="tablist" aria-label="Cultivo" className="scroll-thin flex gap-1 overflow-x-auto border-b border-line px-5">
        {CROPS.map((c) => {
          const on = c.id === data.crop;
          const tiene = contratados.includes(c.id);
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={on}
              onClick={() => onCultivo(c.id)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] whitespace-nowrap',
                on ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {!tiene && <Lock className="size-3" aria-label="No incluido en tu plan" />}
              {c.nombre}
            </button>
          );
        })}
      </div>

      <div className={cn('pt-3 transition-opacity', cargando && 'opacity-60')}>
        {!data.incluido ? (
          <div className="mx-6 mb-6 rounded-2xl bg-surface px-6 py-10 text-center">
            <p className="font-medium">{cultivo} no está en tu plan</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">
              Agrégalo para ver su temporada en curso y comprar sus campañas anteriores. Te enviaremos la nueva tarifa antes de cobrar.
            </p>
            <button
              onClick={onAgregarCultivo}
              disabled={pendiente !== null}
              className="crop-tint mt-4 inline-flex items-center gap-2 rounded-lg bg-crop px-4 py-2.5 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-70"
            >
              {pendiente === 'cultivo' ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar {cultivo.toLowerCase()} a mi plan
            </button>
          </div>
        ) : (
          <ol className="px-3 pb-3 sm:px-4">
            {data.lista.map((c) => {
              const e = ESTADO[c.estado];
              return (
                <li
                  key={c.id}
                  className={cn(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-3 sm:grid-cols-[150px_minmax(0,1fr)_170px_210px]',
                    c.estado === 'en_curso' && 'crop-tint bg-crop-soft/60',
                  )}
                >
                  <div className="font-display text-[15px] font-semibold tracking-tight">Campaña {c.etiqueta}</div>
                  <div className="order-3 col-span-2 text-[12.5px] text-muted sm:order-none sm:col-span-1">{c.ventana}</div>
                  <span className={cn('inline-flex w-fit items-center gap-1.5 justify-self-end rounded-full px-2.5 py-1 text-[11.5px] font-medium sm:justify-self-start', e.c)}>
                    <e.Icon className="size-3.5" aria-hidden />
                    {e.l}
                  </span>
                  <div className="order-4 col-span-2 sm:order-none sm:col-span-1 sm:text-right">
                    {c.estado === 'bloqueada' && c.precio_usd !== null ? (
                      <button
                        onClick={() => onPedir(c)}
                        disabled={pendiente !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium hover:border-crop disabled:opacity-60"
                      >
                        {pendiente === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <Unlock className="size-3.5" />}
                        Desbloquear · <span className="num">US$ {fmt(c.precio_usd)}</span>
                      </button>
                    ) : c.estado === 'solicitada' ? (
                      <span className="text-[12px] text-muted">se activa al confirmar el pago</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <p className="border-t border-line px-6 py-3 text-[11.5px] text-faint">
        Pago único por campaña, en US$ sin IGV. El precio baja con la antigüedad. Series completas o por variedad: a cotizar.
      </p>
    </section>
  );
}