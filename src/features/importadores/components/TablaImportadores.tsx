import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Loader2 } from 'lucide-react';
import type { FiltrosImportadores, ImportadorFila, OrdenImportadores } from '@/types/agro';
import { MiniMeses } from '@/components/ui/MiniMeses';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { useMedia } from '@/lib/hooks';
import { rangoTemporada } from '@/lib/temporada';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import { TendenciaBadge } from '../tendencia';

const COLS = 'grid grid-cols-[40px_minmax(240px,1.7fr)_160px_120px_128px_92px_150px_16px] gap-x-4';

const CABECERA: { label: string; orden?: OrdenImportadores; num?: boolean; ayuda?: string }[] = [
  { label: '#' },
  { label: 'Importador', orden: 'nombre' },
  { label: 'Qué compra' },
  { label: 'Cuándo compra', ayuda: 'Toneladas por mes, de enero a diciembre' },
  { label: 'Tendencia', orden: 'tendencia', ayuda: 'Cambio de su participación frente al periodo anterior' },
  { label: 'Proveedores', orden: 'proveedores', num: true },
  { label: 'Toneladas', orden: 'toneladas', num: true },
  { label: '' },
];

/** Puesto: los 3 primeros destacan solo cuando la lista está ordenada por toneladas */
function Puesto({ i, podio }: { i: number; podio: boolean }) {
  if (!podio || i > 2) return <span className="num text-[13px] text-faint">{i + 1}</span>;
  return (
    <span
      className={cn(
        'crop-tint num grid size-7 place-items-center rounded-full font-display text-[13px] font-semibold',
        i === 0 ? 'bg-crop text-white' : 'bg-crop-soft text-crop-ink',
      )}
    >
      {i + 1}
    </span>
  );
}

interface PropsFila {
  f: ImportadorFila;
  i: number;
  podio: boolean;
  maxShare: number;
  seleccionada: boolean;
  onAbrir: (n: string) => void;
}

function FilaEscritorio({ f, i, podio, maxShare, seleccionada, onAbrir }: PropsFila) {
  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={seleccionada}
      onClick={() => onAbrir(f.n)}
      onKeyDown={(ev: KeyboardEvent) => ev.key === 'Enter' && onAbrir(f.n)}
      className={cn(
        COLS,
        'group relative cursor-pointer items-center border-b border-line px-5 py-3.5 text-[13px] outline-offset-[-2px]',
        seleccionada ? 'crop-tint bg-crop-soft/70' : 'hover:bg-surface/70',
      )}
    >
      <span
        aria-hidden
        className={cn('crop-tint absolute inset-y-0 left-0 w-[3px] bg-crop transition-opacity', seleccionada ? 'opacity-100' : 'opacity-0 group-hover:opacity-60')}
      />
      <div role="cell"><Puesto i={i} podio={podio} /></div>
      <div role="cell" className="min-w-0">
        <div className="truncate text-[13.5px] font-medium group-hover:text-crop-ink" title={titulo(f.n)}>{titulo(f.n)}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
          <Bandera pais={f.pais} />
          <span className="truncate">{nombrePais(f.pais)}</span>
          <span className="text-faint">·</span>
          <span className="num shrink-0">{fmt(f.envios)} {f.envios === 1 ? 'envío' : 'envíos'}</span>
        </div>
      </div>
      <div role="cell" className="min-w-0">
        {f.variedad ? (
          <>
            <span className="crop-tint inline-block max-w-full truncate rounded-md bg-crop-soft px-2 py-0.5 text-[12px] font-medium text-crop-ink">{titulo(f.variedad)}</span>
            <div className="num mt-1 text-[11.5px] text-faint">{Math.round(f.variedad_share)}% de sus compras</div>
          </>
        ) : <span className="text-faint">Sin dato</span>}
      </div>
      <div role="cell">
        <MiniMeses meses={f.meses} />
        <div className="mt-1 text-[11.5px] text-muted">{rangoTemporada(f.meses)}</div>
      </div>
      <div role="cell"><TendenciaBadge t={f.tendencia} pp={f.delta_pp} /></div>
      <div role="cell" className="num text-right text-muted">{fmt(f.proveedores)}</div>
      <div role="cell" className="flex flex-col items-end">
        <div className="num font-display text-[15px] leading-none font-semibold">
          {fmt(f.t)} <span className="font-sans text-[11.5px] font-normal text-faint">t</span>
        </div>
        <div className="mt-1.5 flex w-full items-center justify-end gap-2">
          <span className="h-1 w-20 overflow-hidden rounded-full bg-surface">
            <span className="crop-tint block h-full rounded-full bg-crop" style={{ width: `${Math.max(3, (f.share / maxShare) * 100)}%` }} />
          </span>
          <span className="num w-10 text-right text-[11.5px] text-muted">{f.share < 0.1 ? '<0,1' : fmt1(f.share)}%</span>
        </div>
      </div>
      <div role="cell" aria-hidden>
        <ChevronRight className={cn('size-4 transition-transform group-hover:translate-x-0.5', seleccionada ? 'text-crop' : 'text-line group-hover:text-muted')} />
      </div>
    </div>
  );
}

function FilaMovil({ f, i, podio, seleccionada, onAbrir }: PropsFila) {
  return (
    <button onClick={() => onAbrir(f.n)} className={cn('block w-full border-b border-line px-4 py-3.5 text-left text-[13px]', seleccionada && 'bg-crop-soft/70')}>
      <div className="flex items-center gap-3">
        <Puesto i={i} podio={podio} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{titulo(f.n)}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <Bandera pais={f.pais} />
            <span className="truncate">{nombrePais(f.pais)}{f.variedad ? `, ${titulo(f.variedad)}` : ''}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num font-display text-[15px] font-semibold">{fmt(f.t)} t</div>
          <div className="num text-[11.5px] text-muted">{fmt1(f.share)}%</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 pl-10">
        <TendenciaBadge t={f.tendencia} compacto />
        <span className="flex items-center gap-2 text-[11.5px] text-muted">
          {rangoTemporada(f.meses)}
          <MiniMeses meses={f.meses} />
        </span>
      </div>
    </button>
  );
}

export function TablaImportadores({
  filas, total, filtros, seleccionado, hayMas, cargandoMas, onCargarMas, onOrdenar, onAbrir,
}: {
  filas: ImportadorFila[];
  total: number;
  filtros: FiltrosImportadores;
  seleccionado: string | null;
  hayMas: boolean;
  cargandoMas: boolean;
  onCargarMas: () => void;
  onOrdenar: (c: OrdenImportadores) => void;
  onAbrir: (n: string) => void;
}) {
  const escritorio = useMedia('(min-width: 768px)');
  const ref = useRef<HTMLDivElement>(null);
  const podio = filtros.orden === 'toneladas' && filtros.dir === 'desc';
  const maxShare = useMemo(() => Math.max(0.1, ...filas.map((f) => f.share)), [filas]);
  const v = useVirtualizer({
    count: filas.length,
    getScrollElement: () => ref.current,
    estimateSize: () => (escritorio ? 72 : 100),
    overscan: 12,
    getItemKey: (i) => filas[i].n,
  });

  const clave = JSON.stringify(filtros);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [clave]);

  const items = v.getVirtualItems();
  const ultimo = items[items.length - 1]?.index ?? 0;
  useEffect(() => {
    if (hayMas && !cargandoMas && ultimo >= filas.length - 20) onCargarMas();
  }, [ultimo, filas.length, hayMas, cargandoMas, onCargarMas]);

  return (
    <div
      ref={ref}
      role="table"
      aria-label="Ranking de importadores"
      aria-rowcount={total}
      className="scroll-thin relative h-[calc(100dvh-220px)] min-h-[520px] overflow-auto rounded-2xl border border-line bg-paper shadow-[0_1px_2px_rgba(14,34,25,0.04)]"
    >
      <div className={escritorio ? 'min-w-[1000px]' : undefined}>
        {escritorio && (
          <div role="row" className={cn(COLS, 'sticky top-0 z-10 border-b border-line bg-paper/95 px-5 py-3 text-[12px] text-muted backdrop-blur')}>
            {CABECERA.map((c, i) => {
              const activa = c.orden && filtros.orden === c.orden;
              const Icono = !activa ? ArrowUpDown : filtros.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <div key={i} role="columnheader" title={c.ayuda} className={cn(c.num && 'text-right')}
                  aria-sort={activa ? (filtros.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.orden ? (
                    <button onClick={() => onOrdenar(c.orden!)} className={cn('inline-flex items-center gap-1 hover:text-ink', activa && 'font-medium text-ink')}>
                      {c.label}
                      <Icono className={cn('size-3', !activa && 'opacity-40')} />
                    </button>
                  ) : c.label}
                </div>
              );
            })}
          </div>
        )}

        <div role="rowgroup" style={{ height: v.getTotalSize(), position: 'relative' }}>
          {items.map((it) => {
            const f = filas[it.index];
            const props = { f, i: it.index, podio, maxShare, seleccionada: f.n === seleccionado, onAbrir };
            return (
              <div key={it.key} data-index={it.index} ref={v.measureElement}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${it.start}px)` }}>
                {escritorio ? <FilaEscritorio {...props} /> : <FilaMovil {...props} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-5 py-2.5 text-[12.5px] text-muted backdrop-blur">
        <span className="num">Mostrando {fmt(filas.length)} de {fmt(total)} importadores</span>
        {cargandoMas ? (
          <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Cargando más</span>
        ) : (
          <span>Elige un importador para ver su perfil</span>
        )}
      </div>
    </div>
  );
}