import { ArrowDown, CalendarClock, Loader2, RefreshCw } from 'lucide-react';
import type { CropId, CuentaSuscripcion, PlanCatalogo } from '@/types/agro';
import { CROPS, cropById } from '@/config/crops';
import { diasParaVencer } from '@/features/sesion/useSesion';
import { cn, fmt } from '@/lib/format';

/** Mismo color que cada cultivo en index.css, para las fichas de cultivos contratados */
const COLOR_CULTIVO: Record<CropId, string> = {
  uva: '#b98ad6',
  palta: '#8fc77a',
  arandano: '#93a6ef',
  mango: '#f0a95a',
  limon: '#c4dc5c',
};

const IGV = 0.18;
const fecha = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
const dia = (iso: string) => new Date(`${iso}T12:00:00`);
const usd = (n: number) => `US$ ${fmt(n)}`;

/** Cabecera oscura: qué plan tiene el cliente, qué cubre, cuándo vence y cuánto pagará */
export function HeroCuenta({
  cuenta,
  plan,
  onRenovar,
  renovando,
}: {
  cuenta: CuentaSuscripcion;
  plan: PlanCatalogo;
  onRenovar: () => void;
  renovando: boolean;
}) {
  const dias = diasParaVencer(cuenta.vence);
  const total = Math.max(1, (dia(cuenta.vence).getTime() - dia(cuenta.inicio).getTime()) / 86_400_000);
  const usado = Math.min(100, Math.max(0, ((total - Math.max(dias, 0)) / total) * 100));
  const urgente = dias <= 15;
  const siguiente = new Date(dia(cuenta.vence).getTime() + 86_400_000);
  const todos = cuenta.cultivos.length >= CROPS.length;
  const irAPlanes = () => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:gap-12">
        <div className="min-w-0">
          <p className="text-[12.5px] text-white/60">Tu suscripción · {cuenta.empresa}</p>
          <h1 className="mt-2 font-display text-[44px] leading-[0.98] font-semibold tracking-[-0.035em] sm:text-[60px]">
            {cuenta.prueba ? 'Prueba' : 'Plan'} <span className="text-mint">{plan.nombre}</span>
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-snug text-white/75">
            {todos ? 'Los 5 cultivos' : `${cuenta.cultivos.length} ${cuenta.cultivos.length === 1 ? 'cultivo' : 'cultivos'}`}
            {cuenta.prueba ? '' : `, facturación ${cuenta.facturacion}`} y datos actualizados {plan.actualizacion}. {plan.lema}
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {cuenta.cultivos.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[12.5px] ring-1 ring-white/10">
                <span className="size-2 rounded-full" style={{ background: COLOR_CULTIVO[c] }} aria-hidden />
                {cropById(c).nombre}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <button
              onClick={cuenta.prueba ? irAPlanes : onRenovar}
              disabled={renovando}
              className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-[13.5px] font-semibold text-forest hover:brightness-105 disabled:opacity-70"
            >
              {renovando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {cuenta.prueba ? 'Elegir un plan' : 'Renovar ahora'}
            </button>
            <a
              href="#planes"
              onClick={(e) => {
                e.preventDefault();
                irAPlanes();
              }}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] text-white/85 ring-1 ring-white/20 hover:bg-white/5"
            >
              <ArrowDown className="size-4" />
              Ver planes
            </a>
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3 text-[12.5px] text-white/60">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden />
                Vigencia
              </span>
              <span>
                {fechaCorta.format(dia(cuenta.inicio))} – {fechaCorta.format(dia(cuenta.vence))}
              </span>
            </div>
            <div
              className={cn(
                'num mt-3 font-display text-[34px] leading-none font-semibold tracking-tight',
                urgente ? 'text-[#f2c48d]' : 'text-white',
              )}
            >
              {dias < 0 ? 'Vencida' : `${fmt(dias)} ${dias === 1 ? 'día' : 'días'}`}
            </div>
            <p className="mt-1 text-[12.5px] text-white/60">
              {dias < 0 ? `venció el ${fecha.format(dia(cuenta.vence))}` : `hasta el ${fecha.format(dia(cuenta.vence))}`}
            </p>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={`Transcurrido ${Math.round(usado)}% del periodo`}
            >
              <div className={cn('h-full rounded-full', urgente ? 'bg-[#f2c48d]' : 'bg-mint')} style={{ width: `${usado}%` }} />
            </div>
          </div>

          {cuenta.prueba ? (
            <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <div className="text-[12.5px] text-white/60">Prueba gratis · sin tarjeta</div>
              <div className="mt-3 font-display text-[34px] leading-none font-semibold tracking-tight">Sin cobro</div>
              <p className="mt-1 text-[12.5px] text-white/60">
                Elige un plan antes del {fecha.format(dia(cuenta.vence))} para no perder el acceso.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <div className="text-[12.5px] text-white/60">Próxima factura · {fecha.format(siguiente)}</div>
              <div className="num mt-3 font-display text-[34px] leading-none font-semibold tracking-tight">
                {usd(cuenta.monto_usd)}
                <span className="ml-2 text-[14px] font-normal text-white/60">+ IGV</span>
              </div>
              <p className="mt-1 text-[12.5px] text-white/60">
                {usd(cuenta.monto_usd * (1 + IGV))} con IGV · pago {cuenta.facturacion === 'anual' ? 'anual (10 meses)' : 'mensual'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}