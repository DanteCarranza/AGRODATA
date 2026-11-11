import { Link } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1 } from '@/lib/format';
import { useAcceso, useDestinoAcceso } from './useAcceso';
import { Niveles } from './components/Niveles';

export default function AccesoPage() {
  const { crop } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const { destino, setDestino } = useDestinoAcceso();
  const { data, isError, error, refetch, isPlaceholderData } = useAcceso(crop, destino);

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo cargar acceso a mercados</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  const c = data?.comercio;

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-[13px] text-muted">Acceso a mercados · {cultivo}</p>
        <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
          Qué pide cada <span className="crop-tint text-crop">mercado</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          Lo que necesitas para exportar a un país, ordenado como lo exige la realidad: primero lo fitosanitario, después los residuos de
          plaguicidas y al final los trámites propios de cada mercado.
        </p>
      </header>

      {data ? (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="mt-7">
            <p className="text-[12.5px] text-muted">Elige el mercado</p>
            <div className="scroll-thin -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2">
              {data.destinos.slice(0, 14).map((d) => {
                const on = d.n === data.destino;
                return (
                  <button
                    key={d.n}
                    onClick={() => setDestino(d.n)}
                    aria-pressed={on}
                    className={cn(
                      'crop-tint inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors',
                      on ? 'border-crop bg-crop text-white' : 'border-line bg-paper hover:border-faint',
                    )}
                  >
                    <Bandera pais={d.n} />
                    {nombrePais(d.n)}
                  </button>
                );
              })}
              {data.destinos.length > 14 && (
                <select
                  value={data.destinos.slice(0, 14).some((d) => d.n === data.destino) ? '' : data.destino}
                  onChange={(e) => e.target.value && setDestino(e.target.value)}
                  className="shrink-0 rounded-full border border-line bg-paper px-3.5 py-2 text-[13px]"
                  aria-label="Otros mercados"
                >
                  <option value="">Otros mercados</option>
                  {data.destinos.slice(14).map((d) => <option key={d.n} value={d.n}>{nombrePais(d.n)}</option>)}
                </select>
              )}
            </div>
          </div>

          <section className="relative isolate mt-4 overflow-hidden rounded-3xl bg-forest p-6 text-white sm:p-8">
            <div
              aria-hidden
              className="crop-tint absolute inset-0 -z-10 opacity-90"
              style={{ background: 'radial-gradient(700px 320px at 95% -10%, color-mix(in oklab, var(--color-crop) 55%, transparent), transparent 70%)' }}
            />
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Bandera pais={data.destino} className="h-7 w-[42px] rounded-[4px]" />
                  <h2 className="font-display text-[34px] leading-none font-semibold tracking-tight sm:text-[42px]">{nombrePais(data.destino)}</h2>
                </div>
                {data.rige && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12.5px] text-white/80">
                    <Info className="size-3.5" aria-hidden />
                    Se rige por los requisitos de la {nombrePais(data.rige)}
                  </p>
                )}
                <p className="mt-3 max-w-[52ch] text-[14px] leading-snug text-white/80">
                  {c
                    ? <>El mercado está abierto: Perú ya le envió {cultivo.toLowerCase()} {fmt(c.envios)} veces, el {fmt1(c.share)}% de todos los envíos del cultivo.</>
                    : <>No encontramos envíos de {cultivo.toLowerCase()} a este mercado. Confirma que el acceso esté abierto antes de ofertar.</>}
                </p>
              </div>
              {c && (
                <dl className="flex gap-8">
                  <div>
                    <dd className="num font-display text-[30px] leading-none font-semibold text-mint">{fmt(c.envios)}</dd>
                    <dt className="mt-1.5 text-[12px] text-white/55">envíos en la base oficial</dt>
                  </div>
                  <div>
                    <dd className="num font-display text-[30px] leading-none font-semibold">{fmt(c.exportadores)}</dd>
                    <dt className="mt-1.5 text-[12px] text-white/55">exportadores en la muestra</dt>
                  </div>
                  {c.desde && (
                    <div>
                      <dd className="num font-display text-[30px] leading-none font-semibold">{c.desde}</dd>
                      <dt className="mt-1.5 text-[12px] text-white/55">primer envío en la muestra</dt>
                    </div>
                  )}
                </dl>
              )}
            </div>
            {c && (
              <Link
                to={`/envios?destino=${encodeURIComponent(data.destino)}`}
                className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-mint hover:underline"
              >
                Ver quién exporta ahí <ChevronRight className="size-4" />
              </Link>
            )}
          </section>

          <div className="mt-8">
            <Niveles data={data} cultivo={cultivo} />
          </div>

          <p className="mt-8 text-[12px] text-faint">
            AgroDataCore ordena la información para orientarte; los requisitos vigentes son los que publica la autoridad sanitaria. Antes de
            embarcar, confirma siempre con la consulta oficial de SENASA y con tu importador.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-[220px] w-full rounded-3xl" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}