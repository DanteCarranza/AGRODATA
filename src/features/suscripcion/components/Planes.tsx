import { Check, Loader2, Minus, X } from 'lucide-react';
import type { CuentaSuscripcion, Facturacion, PlanCatalogo, PlanId } from '@/types/agro';
import { cn, fmt } from '@/lib/format';

const ORDEN: PlanId[] = ['esencial', 'profesional', 'enterprise'];

function Precio({ mensual, desde, facturacion, oscuro }: { mensual: number; desde?: boolean; facturacion: Facturacion; oscuro: boolean }) {
  const anual = facturacion === 'anual';
  return (
    <span className="shrink-0 text-right">
      <span className="num font-display text-[20px] leading-none font-semibold tracking-tight whitespace-nowrap">
        {desde && <span className={cn('mr-1 text-[12px] font-normal', oscuro ? 'text-white/60' : 'text-muted')}>desde</span>}
        US$ {fmt(anual ? mensual * 10 : mensual)}
      </span>
      {anual && (
        <span className={cn('block text-[11px]', oscuro ? 'text-white/55' : 'text-faint')}>equivale a US$ {fmt((mensual * 10) / 12)} al mes</span>
      )}
    </span>
  );
}

const ICONO = {
  si: { Icon: Check, c: 'text-ok', co: 'text-mint' },
  parcial: { Icon: Minus, c: 'text-warn', co: 'text-[#f2c48d]' },
  no: { Icon: X, c: 'text-faint', co: 'text-white/30' },
};

/** Los tres planes con su tarifa por número de cultivos. La tarifa del cliente se marca en su plan. */
export function Planes({
  planes, cuenta, facturacion, onFacturacion, onElegir, pendiente,
}: {
  planes: PlanCatalogo[];
  cuenta: CuentaSuscripcion;
  facturacion: Facturacion;
  onFacturacion: (f: Facturacion) => void;
  onElegir: (p: PlanId) => void;
  /** plan cuyo pedido se está enviando */
  pendiente: PlanId | null;
}) {
  const actual = ORDEN.indexOf(cuenta.plan);

  return (
    <section id="planes" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            Elige cuánto <span className="crop-tint text-crop">quieres ver</span>
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">Se cobra por cultivo porque cada uno es una base de datos que mantenemos por separado.</p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-paper p-1 text-[13px]" role="radiogroup" aria-label="Facturación">
          {(['mensual', 'anual'] as Facturacion[]).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={facturacion === f}
              onClick={() => onFacturacion(f)}
              className={cn(
                'crop-tint rounded-lg px-3.5 py-1.5 transition-colors',
                facturacion === f ? 'bg-crop font-medium text-white' : 'text-muted hover:text-ink',
              )}
            >
              {f === 'mensual' ? 'Mensual' : 'Anual'}
              {f === 'anual' && <span className={cn('ml-1.5 text-[11.5px]', facturacion === f ? 'text-white/80' : 'text-ok')}>2 meses gratis</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {planes.map((p) => {
          const oscuro = p.destacado;
          const i = ORDEN.indexOf(p.id);
          const esActual = p.id === cuenta.plan;
          const tarifaCliente = esActual ? p.tarifas.find((t) => t.cultivos >= cuenta.cultivos.length) ?? p.tarifas[p.tarifas.length - 1] : null;
          const cta = esActual ? 'Tu plan actual' : p.id === 'enterprise' ? 'Cotizar Enterprise' : i > actual ? `Mejorar a ${p.nombre}` : `Cambiar a ${p.nombre}`;

          return (
            <article
              key={p.id}
              className={cn(
                'relative flex min-w-0 flex-col rounded-3xl p-6',
                oscuro ? 'bg-forest text-white shadow-[0_24px_50px_-28px_rgba(14,34,25,0.7)]' : 'border border-line bg-paper',
                esActual && !oscuro && 'ring-2 ring-crop crop-tint',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-[22px] font-semibold tracking-tight">{p.nombre}</h3>
                {esActual ? (
                  <span className={cn('rounded-full px-2.5 py-1 text-[11.5px] font-medium', oscuro ? 'bg-mint text-forest' : 'crop-tint bg-crop-soft text-crop-ink')}>
                    Tu plan
                  </span>
                ) : p.destacado ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-mint">Más elegido</span>
                ) : null}
              </div>
              <p className={cn('mt-1 text-[13px]', oscuro ? 'text-white/65' : 'text-muted')}>{p.lema}</p>

              <ul className={cn('mt-5 divide-y border-y', oscuro ? 'divide-white/10 border-white/10' : 'divide-line border-line')}>
                {p.tarifas.map((t) => {
                  const suya = tarifaCliente === t;
                  return (
                    <li key={t.etiqueta} className="flex items-center justify-between gap-3 py-3">
                      <span className={cn('text-[13px]', oscuro ? 'text-white/80' : 'text-ink')}>
                        {t.etiqueta}
                        {suya && <span className={cn('ml-2 text-[11px] font-medium', oscuro ? 'text-mint' : 'crop-tint text-crop')}>tu tarifa</span>}
                      </span>
                      <Precio mensual={t.mensual} desde={t.desde} facturacion={facturacion} oscuro={oscuro} />
                    </li>
                  );
                })}
              </ul>
              <p className={cn('mt-2 text-[11.5px]', oscuro ? 'text-white/55' : 'text-faint')}>
                + IGV · {facturacion === 'anual' ? 'por año' : 'por mes'} · actualización {p.actualizacion}
                {p.id === 'enterprise' && ' · según alcance'}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {p.incluye.map((f) => {
                  const { Icon, c, co } = ICONO[f.nivel];
                  return (
                    <li key={f.t} className={cn('flex gap-2.5 text-[13px] leading-snug', f.nivel === 'no' && (oscuro ? 'text-white/40' : 'text-faint'))}>
                      <Icon className={cn('mt-0.5 size-4 shrink-0', oscuro ? co : c)} aria-label={f.nivel === 'si' ? 'Incluido' : f.nivel === 'parcial' ? 'Parcial' : 'No incluido'} />
                      {f.t}
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => onElegir(p.id)}
                disabled={esActual || pendiente !== null}
                className={cn(
                  'mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-medium transition',
                  esActual
                    ? oscuro ? 'cursor-default bg-white/8 text-white/60' : 'cursor-default bg-surface text-muted'
                    : oscuro ? 'bg-mint text-forest hover:brightness-105' : 'crop-tint bg-crop text-white hover:brightness-110',
                  pendiente !== null && !esActual && 'opacity-70',
                )}
              >
                {pendiente === p.id && <Loader2 className="size-4 animate-spin" />}
                {cta}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}