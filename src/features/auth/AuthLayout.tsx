import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LineChart, Route, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avisos } from '@/components/ui/Avisos';
import { CROPS } from '@/config/crops';
import { useFiltros } from '@/store/filtros';

const PUNTO: Record<string, string> = { uva: '#b98ad6', palta: '#8fc77a', arandano: '#93a6ef', mango: '#f0a95a', limon: '#c4dc5c' };

const VALOR = [
  { Icon: Route, t: 'Trazabilidad hasta el campo', d: 'Qué campo, qué exportador y qué importador mueve cada envío.' },
  { Icon: LineChart, t: 'A quién vender y cuándo', d: 'Temporadas de compra, mercados saturados y variedades que crecen.' },
  { Icon: ShieldCheck, t: 'Certificados y alertas', d: 'Saldos fitosanitarios, requisitos de acceso y rechazos en destino.' },
];

/** Pantallas sin sesión: marca a la izquierda, formulario a la derecha */
export default function AuthLayout() {
  const crop = useFiltros((s) => s.crop);
  useEffect(() => {
    document.documentElement.dataset.crop = crop;
  }, [crop]);

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-forest px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div
          aria-hidden
          className="crop-tint absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(760px 420px at 110% -10%, color-mix(in oklab, var(--color-crop) 60%, transparent), transparent 70%),' +
              'radial-gradient(620px 360px at -10% 110%, color-mix(in oklab, var(--color-mint) 18%, transparent), transparent 70%)',
          }}
        />
        <Logo />
        <div className="my-auto max-w-[520px] py-12">
          <h1 className="font-display text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] xl:text-[54px]">
            Del campo al importador, <span className="text-mint">en una sola vista</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Envíos, campos certificados e importadores de uva, palta, arándano, mango y limón, cruzados para que decidas a quién vender
            y cuándo.
          </p>
          <ul className="mt-9 space-y-5">
            {VALOR.map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-mint ring-1 ring-white/10">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <div className="text-[14.5px] font-medium">{t}</div>
                  <div className="text-[13px] text-white/60">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-white/55">
          {CROPS.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: PUNTO[c.id] }} aria-hidden />
              {c.nombre}
            </span>
          ))}
          <span className="basis-full pt-2 text-white/40">Datos públicos oficiales de MIDAGRI, MINCETUR y MEF.</span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col px-5 py-8 sm:px-10">
        <Logo tono="oscuro" className="lg:hidden" />
        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <Outlet />
        </div>
      </main>
      <Avisos />
    </div>
  );
}