import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { NAV_FLAT } from '@/config/nav';
import { PITCH, PLAN_MINIMO, PLAN_NOMBRE } from '@/config/acceso';
import { useSesionActiva } from '@/features/sesion/useSesion';
import { useSolicitud } from '@/features/suscripcion/useSuscripcion';
import { avisar } from '@/store/avisos';

/** Vista previa decorativa: no carga datos (el backend respondería 403), solo sugiere el módulo detrás del vidrio */
function Fondo() {
  const barras = [38, 52, 46, 70, 88, 64, 58, 76, 92, 60, 44, 36];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none p-6 opacity-70 blur-[7px] sm:p-8">
      <div className="crop-tint h-28 rounded-3xl bg-forest" />
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-paper p-4">
            <div className="h-3 w-20 rounded bg-line" />
            <div className="crop-tint mt-4 h-7 w-24 rounded bg-crop/40" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex h-64 items-end gap-2 rounded-2xl border border-line bg-paper p-5">
          {barras.map((h, i) => <div key={i} className="crop-tint flex-1 rounded-t bg-crop/50" style={{ height: `${h}%` }} />)}
        </div>
        <div className="space-y-3 rounded-2xl border border-line bg-paper p-5">
          {[90, 74, 62, 55, 41, 33].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-24 rounded bg-line" />
              <div className="crop-tint h-3 rounded bg-crop/40" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Lo que ve el cliente al abrir un módulo que su plan no incluye */
export function BloqueoPlan({ ruta }: { ruta: string }) {
  const s = useSesionActiva();
  const solicitud = useSolicitud();
  const item = NAV_FLAT.find((n) => n.to === ruta);
  const plan = PLAN_MINIMO[ruta];
  const pitch = PITCH[ruta];
  const Icon = item?.icon ?? Lock;

  const pedir = () =>
    solicitud.mutate(
      { tipo: 'cambio_plan', plan },
      {
        onSuccess: (r) => avisar({ tono: 'ok', texto: r.mensaje }),
        onError: (e) => avisar({ tono: 'error', texto: `${e.message}. Inténtalo de nuevo.` }),
      },
    );

  return (
    <div className="relative isolate min-h-[640px] overflow-hidden rounded-3xl border border-line bg-surface">
      <Fondo />
      <div className="relative grid min-h-[640px] place-items-center p-5">
        <section className="w-full max-w-[560px] rounded-3xl border border-line bg-paper/95 p-7 shadow-[0_30px_70px_-30px_rgba(14,34,25,0.45)] backdrop-blur sm:p-9">
          <div className="flex items-center gap-3">
            <span className="crop-tint grid size-11 place-items-center rounded-2xl bg-crop-soft text-crop">
              <Icon className="size-[22px]" aria-hidden />
            </span>
            <div className="leading-tight">
              <div className="text-[13px] text-muted">{item?.label ?? 'Módulo'}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-medium text-warn">
                <Lock className="size-3.5" aria-hidden />
                Disponible desde el plan {PLAN_NOMBRE[plan]}
              </div>
            </div>
          </div>

          <h1 className="mt-6 font-display text-[30px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[34px]">
            {pitch?.titulo ?? `Abre ${item?.label ?? 'este módulo'} con el plan ${PLAN_NOMBRE[plan]}`}
          </h1>
          {pitch && (
            <ul className="mt-5 space-y-2.5">
              {pitch.puntos.map((p) => (
                <li key={p} className="flex gap-2.5 text-[14px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              to="/suscripcion?ver=planes"
              className="crop-tint flex items-center gap-2 rounded-xl bg-crop px-4 py-3 text-[13.5px] font-medium text-white hover:brightness-110"
            >
              Comparar planes
              <ArrowRight className="size-4" />
            </Link>
            <button
              onClick={pedir}
              disabled={solicitud.isPending || solicitud.isSuccess}
              className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-[13.5px] font-medium hover:border-faint disabled:opacity-60"
            >
              {solicitud.isPending && <Loader2 className="size-4 animate-spin" />}
              {solicitud.isSuccess ? 'Pedido enviado' : `Pedir el plan ${PLAN_NOMBRE[plan]}`}
            </button>
          </div>
          <p className="mt-4 text-[12px] text-faint">
            Tu plan actual es {PLAN_NOMBRE[s.plan]}. No se cobra nada hasta que nuestro equipo te confirme el cambio.
          </p>
        </section>
      </div>
    </div>
  );
}