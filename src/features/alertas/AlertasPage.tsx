import { ExternalLink, Info, Lock, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt } from '@/lib/format';
import type { TipoAlerta } from '@/types/agro';
import { useAlertas, useFiltrosAlertas } from './useAlertas';
import { CATEGORIA, TIPO } from './config';
import { TarjetaAlerta } from './components/TarjetaAlerta';

/** Una misma pantalla para las alertas sanitarias (RASFF) y las fitosanitarias (EUROPHYT) */
export default function AlertasPage({ tipo }: { tipo: TipoAlerta }) {
  const t = TIPO[tipo];
  const { crop } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const { soloCultivo, pais, set } = useFiltrosAlertas();
  const { data, isError, error, refetch, isPlaceholderData } = useAlertas({ tipo, crop, soloCultivo, pais });

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudieron cargar las alertas</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-[13px] text-muted">{t.kicker}</p>
        <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
          {t.titulo[0]}<span className="crop-tint text-crop">{t.titulo[1]}</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted">{t.bajada}</p>
      </header>

      {data && !data.conectado && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-warn/5 p-4 ring-1 ring-warn/25">
          <Info className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
          <div className="text-[13.5px]">
            <p className="font-medium">Vista previa con ejemplos</p>
            <p className="mt-0.5 text-muted">
              Estas tarjetas son ejemplos ilustrativos para mostrar cómo se verá el módulo. Las notificaciones reales llegarán cuando
              conectemos {data.fuente.nombre}.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className={cn('min-w-0 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Productos" className="flex rounded-lg border border-line bg-paper p-0.5 text-[13px]">
              {[
                { on: !soloCultivo, l: 'Todos los productos peruanos', v: null },
                { on: soloCultivo, l: `Solo ${cultivo.toLowerCase()}`, v: '1' },
              ].map((o) => (
                <button
                  key={o.l}
                  role="radio"
                  aria-checked={o.on}
                  onClick={() => set({ cultivo: o.v, pais: null })}
                  className={cn('crop-tint rounded-md px-3 py-1.5', o.on ? 'bg-crop text-white' : 'text-muted hover:text-ink')}
                >
                  {o.l}
                  {o.v && data && <span className={cn('num ml-1.5', o.on ? 'text-white/70' : 'text-faint')}>{fmt(data.resumen.del_cultivo)}</span>}
                </button>
              ))}
            </div>
            {pais && (
              <button onClick={() => set({ pais: null })} className="crop-tint inline-flex items-center gap-1.5 rounded-full bg-crop-soft px-3 py-1.5 text-[12.5px] text-crop-ink">
                <Bandera pais={pais} />
                {nombrePais(pais)} ×
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {!data ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-2xl" />)
            ) : data.alertas.length ? (
              data.alertas.map((a) => <TarjetaAlerta key={a.id} a={a} crop={crop} etiquetaPeligro={t.peligro} />)
            ) : (
              <div className="rounded-2xl border border-line bg-paper px-6 py-14 text-center">
                <p className="font-medium">Sin notificaciones {soloCultivo ? `de ${cultivo.toLowerCase()}` : ''} con estos filtros</p>
                <p className="mt-1 text-[13px] text-muted">Prueba con todos los productos peruanos o quita el filtro de país.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {data ? (
            <>
              <section className="rounded-2xl border border-line bg-paper p-5">
                <div className="num font-display text-[40px] leading-none font-semibold">{fmt(data.resumen.total)}</div>
                <p className="mt-1 text-[13px] text-muted">notificaciones con estos filtros</p>

                {data.resumen.paises.length > 0 && (
                  <>
                    <h2 className="mt-5 text-[12.5px] font-medium text-muted">Quién notificó</h2>
                    <ul className="mt-2 space-y-1">
                      {data.resumen.paises.map((p) => {
                        const on = pais === p.n;
                        return (
                          <li key={p.n}>
                            <button
                              onClick={() => set({ pais: on ? null : p.n })}
                              aria-pressed={on}
                              className={cn('crop-tint flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]', on ? 'bg-crop-soft font-medium text-crop-ink' : 'hover:bg-surface')}
                            >
                              <Bandera pais={p.n} />
                              <span className="flex-1 truncate">{nombrePais(p.n)}</span>
                              <span className="num text-muted">{fmt(p.envios)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {data.resumen.categorias.length > 0 && (
                  <>
                    <h2 className="mt-5 text-[12.5px] font-medium text-muted">Por tipo de riesgo</h2>
                    <ul className="mt-2 space-y-1.5">
                      {data.resumen.categorias.map((c) => {
                        const Icono = CATEGORIA[c.k].icono;
                        return (
                          <li key={c.k} className="flex items-center gap-2 px-2 text-[13px]">
                            <Icono className="size-4 text-muted" aria-hidden />
                            <span className="flex-1">{CATEGORIA[c.k].l}</span>
                            <span className="num text-muted">{fmt(c.n)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </section>

              <section className="rounded-2xl bg-surface/80 p-5 text-[13px] leading-relaxed text-muted ring-1 ring-line">
                <h2 className="font-medium text-ink">Qué es esto</h2>
                <p className="mt-1">{t.queEs}</p>
                <a href={data.fuente.url} target="_blank" rel="noreferrer" className="crop-tint mt-3 inline-flex items-center gap-1.5 font-medium text-crop hover:underline">
                  {data.fuente.nombre} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </section>

              <section className="crop-tint rounded-2xl border border-crop/30 bg-crop-soft/50 p-5">
                <div className="flex items-center gap-2">
                  <Lock className="crop-tint size-4 text-crop" aria-hidden />
                  <h2 className="text-[14px] font-semibold">¿Quién fue notificado?</h2>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[11.5px] text-muted">Próximamente</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{t.premium}</p>
                <p className="mt-2 text-[12px] text-faint">Se publicará solo tras una revisión legal de transparencia y protección de datos.</p>
                {tipo === 'fitosanitaria' && (
                  <Link to="/trazabilidad" className="crop-tint mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-crop hover:underline">
                    <Route className="size-4" aria-hidden /> Ver la trazabilidad campo → destino
                  </Link>
                )}
              </section>
            </>
          ) : (
            <Skeleton className="h-[360px] w-full rounded-2xl" />
          )}
        </aside>
      </div>
    </div>
  );
}