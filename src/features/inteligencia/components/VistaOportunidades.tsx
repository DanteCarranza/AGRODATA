import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import type { IntelOportunidades, OportunidadImportador } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, titulo } from '@/lib/format';

const PASO = 12;
const enumerar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

function cuando(faltan: number, mes: number) {
  if (faltan === 0) return `Este mes es su pico (${MESES_LARGO[mes].toLowerCase()})`;
  if (faltan === 1) return `Su pico es el próximo mes (${MESES_LARGO[mes].toLowerCase()})`;
  return `Su pico llega en ${faltan} meses (${MESES_LARGO[mes].toLowerCase()})`;
}

function Tarjeta({ o, ventana }: { o: OportunidadImportador; ventana: number[] }) {
  const max = Math.max(...o.meses, 0.001);
  const urgente = o.faltan <= 1;
  return (
    <Link
      to={`/ranking?importador=${encodeURIComponent(o.n)}`}
      className="group flex flex-col rounded-2xl border border-line bg-paper p-4 transition-shadow hover:border-faint hover:shadow-[0_6px_24px_-12px_rgba(14,34,25,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-[14px] leading-snug font-medium group-hover:text-crop-ink" title={titulo(o.n)}>{titulo(o.n)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <Bandera pais={o.pais} />
            {nombrePais(o.pais)}
          </div>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-line transition-colors group-hover:text-crop" aria-hidden />
      </div>

      <div className="mt-4 flex items-end gap-3">
        <div>
          <div className="num font-display text-[34px] leading-none font-semibold tracking-tight text-crop crop-tint">{Math.round(o.pct_ventana)}%</div>
          <div className="mt-1 text-[11.5px] leading-tight text-muted">de lo que compra en el año<br />cae en estos meses</div>
        </div>
        <div className="ml-auto flex h-14 items-end gap-[3px]" role="img" aria-label="Compras por mes">
          {o.meses.map((v, i) => (
            <span
              key={i}
              title={`${MESES_LARGO[i]}: ${fmt(v)} t`}
              className={cn('crop-tint w-[6px] rounded-[2px]', ventana.includes(i) ? 'bg-crop' : 'bg-crop/20')}
              style={{ height: v ? `${Math.max(8, (v / max) * 100)}%` : '6%' }}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-end gap-[3px] text-[9px] text-faint">
        {MESES.map((m, i) => <span key={m} className={cn('w-[6px] text-center', ventana.includes(i) && 'font-semibold text-crop')}>{m[0]}</span>)}
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', urgente ? 'bg-warn/10 text-warn' : 'bg-surface text-muted')}>
          <CalendarClock className="size-3.5" aria-hidden />
          {cuando(o.faltan, o.mes_pico)}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          {o.variedad && <span className="crop-tint rounded-md bg-crop-soft px-1.5 py-0.5 text-crop-ink">{titulo(o.variedad)}</span>}
          <span className="num">{fmt(o.t)} t en total</span>
          <span className="num">{fmt(o.proveedores)} {o.proveedores === 1 ? 'proveedor' : 'proveedores'}</span>
        </div>
      </div>
    </Link>
  );
}

/** Importadores que entran a su temporada de compra en los próximos tres meses */
export function VistaOportunidades({
  data, cultivo, pais, onPais,
}: {
  data: IntelOportunidades;
  cultivo: string;
  pais: string | null;
  onPais: (p: string | null) => void;
}) {
  const [visibles, setVisibles] = useState(PASO);
  const nombresVentana = data.ventana.map((m) => MESES_LARGO[m].toLowerCase());
  const lista = pais ? data.importadores.filter((i) => i.pais === pais) : data.importadores;

  return (
    <div>
      <section className="relative isolate overflow-hidden rounded-3xl bg-forest p-6 text-white sm:p-8">
        <div
          aria-hidden
          className="crop-tint absolute inset-0 -z-10 opacity-90"
          style={{ background: 'radial-gradient(700px 320px at 95% -10%, color-mix(in oklab, var(--color-crop) 55%, transparent), transparent 70%)' }}
        />
        <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr] xl:items-end">
          <div>
            <p className="text-[12.5px] text-white/60">Tu ventana de venta</p>
            <h2 className="mt-2 font-display text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[42px]">
              {nombresVentana[0][0].toUpperCase() + nombresVentana[0].slice(1)} a {nombresVentana[2]}
            </h2>
            <p className="mt-3 max-w-[46ch] text-[14px] leading-snug text-white/80">
              <b className="num font-semibold text-mint">{fmt(data.importadores.length)} importadores</b> de {cultivo.toLowerCase()} hacen
              al menos el 40% de sus compras del año entre {enumerar(nombresVentana)}. Es el momento de ofrecerles.
            </p>
          </div>
          <div>
            <div className="grid grid-cols-12 gap-1" aria-hidden>
              {MESES.map((m, i) => {
                const on = data.ventana.includes(i);
                return (
                  <div key={m} className="text-center">
                    <div className={cn('h-9 rounded-md', on ? 'bg-mint' : 'bg-white/10', i === data.ventana[0] && 'ring-2 ring-mint/50 ring-offset-2 ring-offset-forest')} />
                    <div className={cn('mt-1.5 text-[11px]', on ? 'font-semibold text-mint' : 'text-white/45')}>{m}</div>
                  </div>
                );
              })}
            </div>
            {data.paises.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {data.paises.slice(0, 6).map((p) => {
                  const on = pais === p.n;
                  return (
                    <button
                      key={p.n}
                      onClick={() => onPais(on ? null : p.n)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition-colors',
                        on ? 'bg-white/[0.16] ring-mint/60' : 'bg-white/[0.06] ring-white/15 hover:bg-white/[0.1]',
                      )}
                    >
                      <Bandera pais={p.n} />
                      {nombrePais(p.n)}
                      <span className="num text-white/55">{fmt(p.importadores)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">
          {pais ? `Importadores en ${nombrePais(pais)}` : 'A quién ofrecerle'}
        </h2>
        <span className="num text-[13px] text-muted">{fmt(lista.length)} importadores</span>
      </div>
      <p className="mt-1 text-[13px] text-muted">Ordenados por cuánto suelen comprar en estos meses. Toca uno para ver su perfil completo.</p>

      {lista.length ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lista.slice(0, visibles).map((o) => <Tarjeta key={o.n} o={o} ventana={data.ventana} />)}
          </div>
          {visibles < lista.length && (
            <div className="mt-5 text-center">
              <button
                onClick={() => setVisibles((v) => v + PASO)}
                className="crop-tint rounded-lg border border-line bg-paper px-4 py-2 text-[13px] font-medium text-crop hover:border-crop"
              >
                Ver {fmt(Math.min(PASO, lista.length - visibles))} más
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-line bg-paper px-6 py-14 text-center text-[13px] text-muted">
          Ningún importador concentra sus compras en estos meses con el periodo elegido. Prueba con todo el histórico.
        </div>
      )}
    </div>
  );
}