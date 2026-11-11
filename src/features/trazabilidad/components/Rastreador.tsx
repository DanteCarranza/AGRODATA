import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Container, Factory, Flag, Loader2, Search, Sprout, Store, type LucideIcon } from 'lucide-react';
import type { Cadena, CadenaNodo, Eslabon, TrazabilidadData } from '@/types/agro';
import { useBusqueda } from '@/features/busqueda/useBusqueda';
import { Bandera } from '@/components/ui/Bandera';
import { Skeleton } from '@/components/ui/Panel';
import { useDebounced } from '@/lib/hooks';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import type { CropId } from '@/types/agro';

const ESLABON: Record<Eslabon, { plural: string; singular: string; icono: LucideIcon }> = {
  campo: { plural: 'Campos', singular: 'Campo', icono: Sprout },
  planta: { plural: 'Plantas', singular: 'Planta de empaque', icono: Factory },
  exportador: { plural: 'Exportadores', singular: 'Exportador', icono: Container },
  importador: { plural: 'Importadores', singular: 'Importador', icono: Store },
  destino: { plural: 'Destinos', singular: 'Destino', icono: Flag },
};
const ORDEN: Eslabon[] = ['campo', 'planta', 'exportador', 'importador', 'destino'];
const VISIBLES = 6;

const nombreNodo = (tipo: Eslabon, n: string) => (tipo === 'destino' ? nombrePais(n) : tipo === 'campo' ? n : titulo(n));

/** Buscador de cualquier eslabón: reutiliza la búsqueda global (Ctrl+K) */
function Buscador({ crop, onElegir }: { crop: CropId; onElegir: (tipo: Eslabon, n: string) => void }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const q = useDebounced(texto, 200);
  const { data, isFetching } = useBusqueda(crop, q);
  const resultados = (data ?? []).filter((r) => r.tipo !== 'variedad').slice(0, 8);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fuera = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  const elegir = (tipo: Eslabon, n: string) => {
    onElegir(tipo, n);
    setTexto('');
    setAbierto(false);
  };

  return (
    <div ref={ref} className="relative w-full sm:max-w-md">
      <label className="relative block">
        <span className="sr-only">Buscar un campo, exportador, importador o destino</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && resultados[0]) elegir(resultados[0].tipo as Eslabon, resultados[0].nombre);
            if (e.key === 'Escape') setAbierto(false);
          }}
          placeholder="Busca un campo, exportador, importador o país"
          className="w-full rounded-lg border border-line bg-paper py-2.5 pr-9 pl-9 text-[13.5px] placeholder:text-faint"
        />
        {isFetching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" />}
      </label>
      {abierto && q.trim().length >= 2 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-lg">
          {resultados.length === 0 && !isFetching && <li className="px-3 py-2.5 text-[13px] text-muted">Sin resultados para “{q}”</li>}
          {resultados.map((r) => {
            const tipo = r.tipo as Eslabon;
            const Icono = ESLABON[tipo].icono;
            return (
              <li key={`${r.tipo}:${r.nombre}`}>
                <button onClick={() => elegir(tipo, r.nombre)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] hover:bg-surface">
                  <Icono className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {nombreNodo(tipo, r.nombre)}
                    {r.detalle && <span className="text-muted"> · {titulo(r.detalle)}</span>}
                  </span>
                  <span className="shrink-0 text-[11.5px] text-faint">{ESLABON[tipo].singular}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Nodo({ tipo, nodo, max, enFoco, onElegir }: { tipo: Eslabon; nodo: CadenaNodo; max: number; enFoco: boolean; onElegir: () => void }) {
  const cuerpo = (
    <>
      <div className={cn('flex items-center gap-1.5 text-[13px] font-medium', nodo.sin_campo && 'text-warn')} title={nodo.sin_campo ? nodo.n : nombreNodo(tipo, nodo.n)}>
        {tipo === 'destino' && <Bandera pais={nodo.n} />}
        <span className={cn('truncate', tipo === 'campo' && !nodo.sin_campo && 'num')}>{nodo.sin_campo ? nodo.n : nombreNodo(tipo, nodo.n)}</span>
      </div>
      {nodo.detalle && <div className="truncate text-[11.5px] text-muted">{nodo.sin_campo ? nodo.detalle : titulo(nodo.detalle)}</div>}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper">
          <div
            className={cn('crop-tint h-full rounded-full', nodo.sin_campo ? 'bg-warn/60' : 'bg-crop')}
            style={{ width: `${Math.max(3, (nodo.t / max) * 100)}%` }}
          />
        </div>
        <span className="num shrink-0 text-[11.5px] font-medium text-muted">{fmt1(nodo.t)} t</span>
      </div>
    </>
  );
  if (nodo.sin_campo) {
    return <div className="rounded-lg border border-dashed border-warn/40 bg-warn/5 px-2.5 py-2">{cuerpo}</div>;
  }
  return (
    <button
      onClick={onElegir}
      aria-pressed={enFoco}
      className={cn(
        'crop-tint block w-full rounded-lg border px-2.5 py-2 text-left transition-colors',
        enFoco ? 'border-crop bg-paper' : 'border-transparent hover:border-line hover:bg-paper',
      )}
    >
      {cuerpo}
    </button>
  );
}

function Columna({ tipo, nodos, foco, onElegir }: { tipo: Eslabon; nodos: CadenaNodo[]; foco: Cadena['foco']; onElegir: (t: Eslabon, n: string) => void }) {
  const [todos, setTodos] = useState(false);
  const e = ESLABON[tipo];
  const Icono = e.icono;
  const reales = nodos.filter((x) => !x.sin_campo);
  const max = Math.max(0.001, ...nodos.map((x) => x.t));
  const visibles = todos ? nodos : nodos.slice(0, VISIBLES);
  const esFoco = foco.tipo === tipo;

  return (
    <div className={cn('crop-tint min-w-0 rounded-xl p-3', esFoco ? 'bg-crop-soft/60 ring-1 ring-crop/25' : 'bg-surface/60')}>
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className={cn('crop-tint grid size-7 place-items-center rounded-lg', esFoco ? 'bg-crop text-white' : 'bg-paper text-muted')}>
          <Icono className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{e.plural}</span>
        <span className="num text-[12px] text-muted">{fmt(reales.length)}</span>
      </div>
      <div className="space-y-1">
        {visibles.map((n) => (
          <Nodo
            key={n.n}
            tipo={tipo}
            nodo={n}
            max={max}
            enFoco={esFoco && foco.n === n.n}
            onElegir={() => onElegir(tipo, n.n)}
          />
        ))}
      </div>
      {nodos.length > VISIBLES && (
        <button onClick={() => setTodos(!todos)} className="crop-tint mt-2 w-full rounded-md px-2 py-1.5 text-[12.5px] text-crop hover:bg-paper">
          {todos ? 'Ver menos' : `Ver ${nodos.length - VISIBLES} más`}
        </button>
      )}
    </div>
  );
}

const ENLACE: Partial<Record<Eslabon, (n: string) => string>> = {
  campo: (n) => `/campos?campo=${encodeURIComponent(n)}`,
  exportador: (n) => `/envios?exportador=${encodeURIComponent(n)}&ficha=${encodeURIComponent(n)}`,
  importador: (n) => `/ranking?importador=${encodeURIComponent(n)}`,
  destino: (n) => `/envios?destino=${encodeURIComponent(n)}`,
};

export function Rastreador({
  crop, cadena, cargando, sugeridos, onElegir,
}: {
  crop: CropId;
  cadena: Cadena | null | undefined;
  cargando: boolean;
  sugeridos: TrazabilidadData['sugeridos'];
  onElegir: (tipo: Eslabon, n: string) => void;
}) {
  const f = cadena?.foco;
  const Icono = f ? ESLABON[f.tipo].icono : Search;
  const enlace = f && ENLACE[f.tipo];

  return (
    <section className="rounded-2xl border border-line bg-paper">
      <header className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5">
        <div className="max-w-xl">
          <h2 className="font-display text-[20px] font-semibold tracking-tight">Sigue la cadena</h2>
          <p className="mt-1 text-[13px] text-muted">
            Elige cualquier eslabón y mira todo lo que está conectado: de qué campos sale la fruta, qué planta la empaca, quién la
            exporta, quién la compra y a qué país llega. Toca un nombre para seguir desde ahí.
          </p>
        </div>
        <Buscador crop={crop} onElegir={onElegir} />
      </header>

      {sugeridos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 pt-3 text-[12.5px]">
          <span className="text-muted">Prueba con:</span>
          {sugeridos.map((s) => {
            const I = ESLABON[s.tipo].icono;
            return (
              <button key={`${s.tipo}:${s.n}`} onClick={() => onElegir(s.tipo, s.n)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 hover:border-faint">
                <I className="size-3.5 text-muted" aria-hidden />
                {nombreNodo(s.tipo, s.n)}
                {s.detalle && <span className="text-muted">{titulo(s.detalle)}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="p-5">
        {!cadena && cargando ? (
          <Skeleton className="h-[460px] w-full rounded-xl" />
        ) : !cadena || !f ? (
          <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center text-[13px] text-muted">
            No hay envíos de ese eslabón en el periodo elegido. Prueba con otro o amplía el periodo.
          </div>
        ) : (
          <div className={cn('transition-opacity', cargando && 'opacity-60')}>
            <div className="crop-tint flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl bg-crop-soft px-5 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="crop-tint grid size-11 shrink-0 place-items-center rounded-xl bg-crop text-white">
                  <Icono className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] text-crop-ink/70">{ESLABON[f.tipo].singular}</div>
                  <div className="flex items-center gap-2 truncate font-display text-[22px] leading-tight font-semibold text-crop-ink">
                    {f.tipo === 'destino' && <Bandera pais={f.n} className="h-4 w-6" />}
                    <span className="truncate">{nombreNodo(f.tipo, f.n)}</span>
                  </div>
                  {f.detalle && <div className="truncate text-[12.5px] text-crop-ink/70">{titulo(f.detalle)}</div>}
                </div>
              </div>
              <dl className="flex gap-6">
                {[
                  { v: `${fmt(cadena.t)} t`, l: f.tipo === 'campo' ? 'aportadas' : 'embarcadas' },
                  { v: fmt(cadena.envios), l: cadena.envios === 1 ? 'envío' : 'envíos' },
                  { v: `${Math.round(cadena.cobertura)}%`, l: 'con campo de origen' },
                ].map((x) => (
                  <div key={x.l}>
                    <dd className="num font-display text-[20px] leading-none font-semibold text-crop-ink">{x.v}</dd>
                    <dt className="mt-1 text-[12px] text-crop-ink/70">{x.l}</dt>
                  </div>
                ))}
              </dl>
              {enlace && (
                <Link to={enlace(f.n)} className="crop-tint inline-flex items-center gap-1 text-[13px] font-medium text-crop hover:underline">
                  Ver ficha <ChevronRight className="size-4" />
                </Link>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))] xl:gap-0">
              {ORDEN.map((tipo, i) => (
                <Fragment key={tipo}>
                  <div className={cn('min-w-0', i > 0 && 'xl:pl-5', 'relative')}>
                    {i > 0 && (
                      <span aria-hidden className="absolute top-4 left-0 hidden size-5 -translate-x-[2px] place-items-center text-faint xl:grid">
                        <ChevronRight className="size-4" />
                      </span>
                    )}
                    <Columna tipo={tipo} nodos={cadena.columnas[tipo]} foco={f} onElegir={onElegir} />
                  </div>
                </Fragment>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-faint">
              {f.tipo === 'campo'
                ? 'Toneladas que salieron de este campo en cada envío, repartidas por planta, exportador, importador y destino.'
                : 'Toneladas embarcadas en los envíos conectados. En campos, lo que aportó cada uno; lo que ningún campo respalda aparece aparte.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}