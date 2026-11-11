import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Loader2, Minus } from 'lucide-react';
import type { DetalleVariedad, IntelVariedades, VariedadIntel } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { MiniMeses } from '@/components/ui/MiniMeses';
import { Seccion } from '@/features/envios/components/FichaExportador';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1, titulo } from '@/lib/format';

const q = encodeURIComponent;

function Cambio({ pp }: { pp: number | null }) {
  if (pp === null) return <span className="text-[12px] text-faint" title="Pocos envíos en alguno de los dos periodos">—</span>;
  if (Math.abs(pp) < 0.3) {
    return <span className="inline-flex items-center gap-0.5 text-[12px] text-muted"><Minus className="size-3.5" aria-hidden />estable</span>;
  }
  const sube = pp > 0;
  return (
    <span className={cn('num inline-flex items-center gap-0.5 text-[12px] font-medium', sube ? 'text-ok' : 'text-bad')}>
      {sube ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
      {sube ? '+' : ''}{fmt1(pp)} pts
    </span>
  );
}

function Destacadas({ titulo: t, filas, onElegir, tono }: { titulo: string; filas: VariedadIntel[]; onElegir: (n: string) => void; tono: 'ok' | 'bad' }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className={cn('flex items-center gap-1.5 text-[13px] font-medium', tono === 'ok' ? 'text-ok' : 'text-bad')}>
        {tono === 'ok' ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
        {t}
      </div>
      {filas.length ? (
        <ul className="mt-2 space-y-1">
          {filas.map((v) => (
            <li key={v.n}>
              <button onClick={() => onElegir(v.n)} className="flex w-full items-center justify-between gap-3 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-surface">
                <span className="truncate">{titulo(v.n)}</span>
                <Cambio pp={v.delta_pp} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted">Ninguna con cambios claros.</p>
      )}
    </div>
  );
}

function Detalle({ d, cargando }: { d: DetalleVariedad | null | undefined; cargando: boolean }) {
  if (!d) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-line bg-paper text-[13px] text-muted">
        {cargando ? <Loader2 className="size-5 animate-spin" /> : 'Elige una variedad'}
      </div>
    );
  }
  const max = Math.max(...d.meses_actual, ...(d.meses_anterior ?? []), 1);
  const pico = d.meses_actual.indexOf(Math.max(...d.meses_actual));
  const picoAntes = d.meses_anterior ? d.meses_anterior.indexOf(Math.max(...d.meses_anterior)) : null;
  const corrimiento = picoAntes !== null && picoAntes !== pico;

  return (
    <section className={cn('rounded-2xl border border-line bg-paper p-5 transition-opacity sm:p-6', cargando && 'opacity-60')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12.5px] text-muted">Variedad</p>
          <h3 className="crop-tint font-display text-[28px] leading-tight font-semibold tracking-tight text-crop">{titulo(d.n)}</h3>
        </div>
        <Link to={`/campos?variedad=${q(d.n)}`} className="crop-tint inline-flex items-center gap-1 text-[13px] font-medium text-crop hover:underline">
          {fmt(d.campos)} campos la producen <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <Seccion
          titulo="Cuándo sale"
          detalle={
            d.comparativo
              ? corrimiento
                ? `El pico se movió de ${MESES_LARGO[picoAntes!].toLowerCase()} a ${MESES_LARGO[pico].toLowerCase()}. ${d.comparativo.actual} frente a ${d.comparativo.anterior}, en % de la temporada.`
                : `Su pico sigue en ${MESES_LARGO[pico].toLowerCase()}. ${d.comparativo.actual} frente a ${d.comparativo.anterior}, en % de la temporada.`
              : `% de lo embarcado que sale cada mes. Su pico es ${MESES_LARGO[pico].toLowerCase()}.`
          }
        >
          <div className="flex h-36 items-end gap-1.5">
            {d.meses_actual.map((v, i) => {
              const antes = d.meses_anterior?.[i] ?? 0;
              return (
                <div key={i} className="relative flex h-full flex-1 items-end justify-center gap-[2px]" title={`${MESES_LARGO[i]}: ${Math.round(v)}%${d.meses_anterior ? ` (antes ${Math.round(antes)}%)` : ''}`}>
                  {d.meses_anterior && (
                    <span className="w-1/2 rounded-t-[3px] bg-line" style={{ height: `${(antes / max) * 100}%`, minHeight: antes ? 2 : 0 }} />
                  )}
                  <span
                    className={cn('crop-tint rounded-t-[3px]', d.meses_anterior ? 'w-1/2' : 'w-full', i === pico ? 'bg-crop' : 'bg-crop/45')}
                    style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {MESES.map((m, i) => <span key={m} className={cn('flex-1 text-center text-[11px]', i === pico ? 'font-semibold text-crop' : 'text-muted')}>{m}</span>)}
          </div>
          {d.comparativo && (
            <div className="mt-3 flex gap-4 text-[12px] text-muted">
              <span className="flex items-center gap-1.5"><span className="crop-tint size-2.5 rounded-sm bg-crop" />{d.comparativo.actual}</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-line" />{d.comparativo.anterior}</span>
            </div>
          )}
        </Seccion>

        <div className="grid gap-6 md:grid-cols-2">
          <Seccion titulo="A dónde va">
            <ul className="space-y-2">
              {d.destinos.map((x) => (
                <li key={x.n}>
                  <div className="flex justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-1.5"><Bandera pais={x.n} /><span className="truncate">{nombrePais(x.n)}</span></span>
                    <span className="num text-muted">{fmt1(x.share)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface">
                    <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(x.share / (d.destinos[0]?.share || 1)) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Seccion>
          <Seccion titulo="Quién la compra">
            <ul className="divide-y divide-line">
              {d.importadores.map((x) => (
                <li key={x.n}>
                  <Link to={`/ranking?importador=${q(x.n)}`} className="group flex items-center gap-2 py-1.5 text-[13px]">
                    <Bandera pais={x.pais} />
                    <span className="min-w-0 flex-1 truncate group-hover:text-crop">{titulo(x.n)}</span>
                    <span className="num text-muted">{fmt(x.t)} t</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        </div>

        <Seccion titulo="Quién la exporta">
          <div className="flex flex-wrap gap-2">
            {d.exportadores.map((x) => (
              <Link
                key={x.n}
                to={`/envios?exportador=${q(x.n)}&ficha=${q(x.n)}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12.5px] hover:border-crop hover:text-crop"
              >
                {titulo(x.n)} <span className="num text-muted">{fmt(x.t)} t</span>
              </Link>
            ))}
          </div>
        </Seccion>
      </div>
    </section>
  );
}

/** Peso de cada variedad, quién gana o pierde terreno, y el detalle de la elegida */
export function VistaVariedades({
  data, detalle, cargandoDetalle, variedad, onVariedad,
}: {
  data: IntelVariedades;
  detalle: DetalleVariedad | null | undefined;
  cargandoDetalle: boolean;
  variedad: string | null;
  onVariedad: (v: string) => void;
}) {
  const conCambio = data.variedades.filter((v) => v.delta_pp !== null && Math.abs(v.delta_pp) >= 0.3);
  const suben = [...conCambio].filter((v) => v.delta_pp! > 0).sort((a, b) => b.delta_pp! - a.delta_pp!).slice(0, 4);
  const bajan = [...conCambio].filter((v) => v.delta_pp! < 0).sort((a, b) => a.delta_pp! - b.delta_pp!).slice(0, 4);
  const maxShare = Math.max(1, ...data.variedades.map((v) => v.share));

  return (
    <div className="space-y-5">
      {data.comparativo && (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
          <Destacadas titulo="Ganan terreno" filas={suben} onElegir={onVariedad} tono="ok" />
          <Destacadas titulo="Pierden terreno" filas={bajan} onElegir={onVariedad} tono="bad" />
          <div className="rounded-2xl bg-surface/80 p-4 text-[12.5px] leading-relaxed text-muted ring-1 ring-line">
            Cambio de su participación en las toneladas: {data.comparativo.actual} frente a {data.comparativo.anterior}. Se compara por
            participación y no por toneladas para que no influya cuánta información hay de cada periodo.
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.8fr)_1.6fr] lg:items-start">
        <section className="rounded-2xl border border-line bg-paper">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">Variedades</h2>
            <p className="text-[12.5px] text-muted">Por toneladas embarcadas</p>
          </div>
          <ul className="scroll-thin max-h-[640px] overflow-y-auto px-2 pb-2">
            {data.variedades.map((v, i) => {
              const on = variedad === v.n;
              return (
                <li key={v.n}>
                  <button
                    onClick={() => onVariedad(v.n)}
                    aria-pressed={on}
                    className={cn('crop-tint flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', on ? 'bg-crop-soft' : 'hover:bg-surface')}
                  >
                    <span className="num w-5 text-[12px] text-faint">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn('truncate text-[13px]', on ? 'font-semibold text-crop-ink' : 'font-medium')}>{titulo(v.n)}</span>
                        <span className="num shrink-0 text-[12px] text-muted">{fmt1(v.share)}%</span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1 flex-1 rounded-full bg-surface">
                          <span className="crop-tint block h-full rounded-full bg-crop" style={{ width: `${(v.share / maxShare) * 100}%` }} />
                        </span>
                        <Cambio pp={v.delta_pp} />
                      </span>
                    </span>
                    <MiniMeses meses={v.meses} className="hidden h-5 shrink-0 sm:flex" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <Detalle d={detalle} cargando={cargandoDetalle} />
      </div>
    </div>
  );
}