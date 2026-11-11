import type { ReactNode } from 'react';
import type { InformeData } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1, titulo } from '@/lib/format';

const fechaLarga = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

function Donut({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[148px] shrink-0 print:size-[124px]">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-crop-soft)" strokeWidth="14" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-crop)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} className="crop-tint" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="num font-display text-[34px] font-semibold tracking-tight">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function Tarjeta({ etiqueta, valor, detalle, tono }: { etiqueta: string; valor: ReactNode; detalle: string; tono: string }) {
  return (
    <div className={cn('rounded-xl p-4', tono)}>
      <div className="text-[11.5px] font-medium opacity-75">{etiqueta}</div>
      <div className="mt-1 truncate font-display text-[19px] leading-tight font-semibold">{valor}</div>
      <div className="mt-0.5 text-[12px] opacity-75">{detalle}</div>
    </div>
  );
}

function Ranking({ titulo: t, filas, color, bandera }: { titulo: string; filas: { n: string; t: number; pais?: string }[]; color: string; bandera?: boolean }) {
  const max = Math.max(...filas.map((f) => f.t), 0.001);
  return (
    <section className="break-inside-avoid">
      <h3 className="text-[13px] font-semibold">{t}</h3>
      {filas.length ? (
        <ol className="mt-3 space-y-2.5">
          {filas.map((f, i) => (
            <li key={f.n} className="grid grid-cols-[18px_minmax(0,1fr)_minmax(60px,0.9fr)_64px] items-center gap-2.5 text-[12.5px]">
              <span className="num text-faint">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                {bandera && <Bandera pais={f.pais ?? f.n} />}
                <span className="truncate" title={titulo(f.n)}>{bandera && !f.pais ? nombrePais(f.n) : titulo(f.n)}</span>
              </span>
              <span className="h-2 rounded-full bg-surface">
                <span className={cn('block h-full rounded-full', color)} style={{ width: `${(f.t / max) * 100}%` }} />
              </span>
              <span className="num text-right font-medium">{fmt(f.t)} t</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-[12.5px] text-muted">Sin datos en el periodo.</p>
      )}
    </section>
  );
}

/** La hoja del informe: pensada para verse en pantalla y para imprimirse en A4 */
export function HojaInforme({
  data, cultivo, periodo, empresa,
}: {
  data: InformeData;
  cultivo: string;
  periodo: string;
  empresa: string | null;
}) {
  const v = data.variedad;
  const total = data.t || 1;
  const lider = data.variedades[0];
  const destino = data.destinos[0];
  const pico = data.meses.indexOf(Math.max(...data.meses));
  const maxMes = Math.max(...data.meses, 0.001);
  const pct = v ? ((destino?.t ?? 0) / total) * 100 : ((lider?.t ?? 0) / total) * 100;

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_24px_60px_-30px_rgba(14,34,25,0.35)] print:rounded-none print:border-0 print:shadow-none">
      {/* Cabecera */}
      <header className="relative isolate overflow-hidden bg-forest px-8 pt-7 pb-9 text-white sm:px-10 print:px-7 print:pt-5 print:pb-6">
        <div
          aria-hidden
          className="crop-tint absolute inset-0 -z-10 opacity-90"
          style={{ background: 'radial-gradient(600px 280px at 100% -20%, color-mix(in oklab, var(--color-crop) 60%, transparent), transparent 70%)' }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
              <rect width="32" height="32" rx="8" fill="#17332a" />
              <path d="M9 22c0-7 5-12 14-12-1 8-6 13-14 12z" fill="#8fd3a8" />
              <path d="M9 22l8-7" stroke="#17332a" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[15px] font-semibold">AgroDataCore</span>
            <span className="text-white/50">Inteligencia agroexportadora</span>
          </div>
          <span className="text-white/60">Informe ejecutivo · {fechaLarga.format(new Date())}</span>
        </div>

        <h2 className="mt-8 font-display text-[36px] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[44px] print:mt-5 print:text-[34px]">
          {v ? (
            <><span className="text-mint">{titulo(v)}</span> en {cultivo.toLowerCase()}</>
          ) : (
            <>Así se movió la <span className="text-mint">{cultivo.toLowerCase()}</span></>
          )}
        </h2>
        <p className="mt-3 text-[13.5px] text-white/70">
          {periodo} · {fmt(data.envios)} envíos · {fmt(data.t)} toneladas analizadas
          {empresa && <> · Preparado para <span className="text-white">{empresa}</span></>}
        </p>
      </header>

      <div className="space-y-8 px-8 py-8 sm:px-10 print:space-y-5 print:px-7 print:py-5">
        {/* Dato principal y tarjetas */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-center break-inside-avoid">
          <div className="flex items-center gap-5">
            <Donut pct={pct} />
            <p className="text-[14px] leading-snug text-muted">
              {v ? (
                <>de esta variedad se exportó a <b className="font-semibold text-ink">{destino ? nombrePais(destino.n) : '—'}</b>, su principal destino.</>
              ) : (
                <>del volumen corresponde a <b className="font-semibold text-ink">{lider ? titulo(lider.n) : '—'}</b>, la variedad líder del periodo.</>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {v ? (
              <Tarjeta etiqueta="Exportadores" valor={fmt(data.exportadores)} detalle="empresas que la envían" tono="crop-tint bg-crop-soft text-crop-ink" />
            ) : (
              <Tarjeta etiqueta="Variedad líder" valor={lider ? titulo(lider.n) : '—'} detalle={lider ? `${fmt(lider.t)} t exportadas` : 'sin dato'} tono="crop-tint bg-crop-soft text-crop-ink" />
            )}
            <Tarjeta
              etiqueta="Destino principal"
              valor={destino ? <span className="inline-flex items-center gap-2"><Bandera pais={destino.n} />{nombrePais(destino.n)}</span> : '—'}
              detalle={destino ? `${fmt(destino.t)} t, ${fmt1((destino.t / total) * 100)}% del total` : 'sin dato'}
              tono="bg-[#e8f1ec] text-[#14513a]"
            />
            {v ? (
              <Tarjeta etiqueta="Importadores" valor={fmt(data.importadores)} detalle={`en ${fmt(data.destinos_n)} países`} tono="bg-[#e9eef6] text-[#24406b]" />
            ) : (
              <Tarjeta
                etiqueta="Gana terreno"
                valor={data.gana_terreno ? titulo(data.gana_terreno.n) : 'Sin cambios claros'}
                detalle={data.gana_terreno ? `+${fmt1(data.gana_terreno.delta_pp)} pts de participación` : 'frente al periodo anterior'}
                tono="bg-[#e9eef6] text-[#24406b]"
              />
            )}
            <Tarjeta etiqueta="Mes pico" valor={MESES_LARGO[pico]} detalle="mayor volumen embarcado" tono="bg-[#fbefe1] text-[#7a4108]" />
          </div>
        </section>

        {/* Calendario */}
        <section className="break-inside-avoid">
          <h3 className="text-[13px] font-semibold">Calendario de envíos</h3>
          <div className="mt-4 flex h-32 items-end gap-1.5 print:h-24">
            {data.meses.map((t, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${MESES_LARGO[i]}: ${fmt(t)} t`}>
                {i === pico && <span className="num text-[11px] font-semibold text-crop-ink">{fmt(t)} t</span>}
                <div
                  className={cn('crop-tint w-full rounded-t-[4px]', i === pico ? 'bg-crop' : 'bg-crop/35')}
                  style={{ height: `${(t / maxMes) * 100}%`, minHeight: t ? 3 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5 border-t border-line pt-1.5">
            {MESES.map((m, i) => (
              <span key={m} className={cn('flex-1 text-center text-[11px]', i === pico ? 'font-semibold text-crop' : 'text-muted')}>{m}</span>
            ))}
          </div>
        </section>

        {/* Rankings */}
        <div className="grid gap-8 md:grid-cols-2 print:gap-6">
          {v ? (
            <Ranking titulo={`Quién compra ${titulo(v)}`} filas={data.importadores_top} color="bg-[#2f5f8a]" bandera />
          ) : (
            <Ranking titulo="Las 5 variedades con más volumen" filas={data.variedades} color="crop-tint bg-crop" />
          )}
          <Ranking titulo="Los 5 principales destinos" filas={data.destinos} color="bg-[#1f7a4d]" bandera />
        </div>

        {v && (
          <div className="grid gap-8 md:grid-cols-2">
            <Ranking titulo={`Quién exporta ${titulo(v)}`} filas={data.exportadores_top} color="crop-tint bg-crop" />
            <section className="break-inside-avoid">
              <h3 className="text-[13px] font-semibold">Campos que la producen</h3>
              {data.campos.length ? (
                <ul className="mt-3 divide-y divide-line">
                  {data.campos.map((c) => (
                    <li key={c.clp} className="flex items-center justify-between gap-3 py-2 text-[12.5px]">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.predio ? titulo(c.predio) : 'Predio sin nombre'}</div>
                        <div className="text-[11.5px] text-muted">{[c.clp, c.region && titulo(c.region)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <span className="num shrink-0 font-medium">{fmt1(c.t)} t</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12.5px] text-muted">Sin campos con esta variedad en el periodo.</p>
              )}
            </section>
          </div>
        )}

        {/* Cifras */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-4 break-inside-avoid">
          {[
            { n: fmt(data.t), l: 'toneladas' },
            { n: fmt(v ? data.exportadores : data.variedades_n), l: v ? 'exportadores' : 'variedades' },
            { n: fmt(data.destinos_n), l: 'destinos' },
            { n: fmt(data.importadores), l: 'importadores' },
          ].map((x) => (
            <div key={x.l} className="bg-surface/70 px-5 py-4">
              <div className="num font-display text-[24px] leading-none font-semibold">{x.n}</div>
              <div className="mt-1 text-[12px] text-muted">{x.l}</div>
            </div>
          ))}
        </section>

        <footer className="border-t border-line pt-5 text-[11.5px] leading-relaxed text-muted print:pt-3 print:text-[10.5px]">
          Generado por <b className="font-semibold text-ink">AgroDataCore</b> con datos oficiales de MIDAGRI, MINCETUR y MEF procesados.
          {data.gana_terreno && !v && <> “Gana terreno” compara la participación en las toneladas: {data.gana_terreno.comparativo}.</>}
          <br />
          © AgroDataCore. Documento de uso exclusivo del cliente con licencia; prohibida su reproducción o redistribución.
        </footer>
      </div>
    </article>
  );
}