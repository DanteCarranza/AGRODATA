import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Loader2, MapPin } from 'lucide-react';
import type { CampoFila, FiltrosCampos, OrdenCampos } from '@/types/agro';
import { useMedia } from '@/lib/hooks';
import { cn, fmt, fmt1, titulo } from '@/lib/format';

const COLS =
  'grid grid-cols-[minmax(220px,1.6fr)_112px_120px_minmax(170px,1.3fr)_64px_84px_128px_16px] gap-x-3';

const CABECERA: { label: string; orden?: OrdenCampos; num?: boolean; ayuda?: string }[] = [
  { label: 'Campo', orden: 'clp' },
  { label: 'Región' },
  { label: 'Variedad' },
  { label: 'Exportadores', orden: 'exportadores' },
  { label: 'Envíos', orden: 'envios', num: true },
  { label: 'Toneladas', orden: 'toneladas', num: true },
  { label: 'Uso de campaña', orden: 'uso', ayuda: 'Parte de la capacidad certificada (área × rendimiento) que ya se exportó' },
  { label: '' },
];

/** <60% holgado, <85% ajustado, desde 85% casi agotado */
export const colorUso = (p: number) => (p < 60 ? 'bg-ok' : p < 85 ? 'bg-warn' : 'bg-bad');

function Uso({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[12px] text-faint">Sin área certificada</span>;
  return (
    <div>
      <div className="num text-right text-[12.5px] text-muted">{fmt1(pct)}%</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={cn('h-full rounded-full', colorUso(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function FilaEscritorio({ f, seleccionada, onAbrir }: { f: CampoFila; seleccionada: boolean; onAbrir: (clp: string) => void }) {
  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={seleccionada}
      onClick={() => onAbrir(f.clp)}
      onKeyDown={(ev: KeyboardEvent) => ev.key === 'Enter' && onAbrir(f.clp)}
      className={cn(
        COLS,
        'group cursor-pointer items-center border-b border-line px-5 py-3 text-[13px] outline-offset-[-2px]',
        seleccionada ? 'crop-tint bg-crop-soft/70' : 'hover:bg-surface/80',
      )}
    >
      <div role="cell" className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="num shrink-0 rounded bg-surface px-1.5 py-px text-[11.5px] text-muted">{f.clp}</span>
          {f.gps && <MapPin className="size-3.5 shrink-0 text-crop" aria-label="Con coordenadas GPS" />}
        </div>
        <div className="mt-1 truncate font-medium">{f.predio ? titulo(f.predio) : <span className="font-normal text-faint">Predio sin nombre</span>}</div>
        {f.productor && <div className="truncate text-[12px] text-muted">{titulo(f.productor)}</div>}
      </div>
      <div role="cell" className="truncate">{f.region ? titulo(f.region) : <span className="text-faint">Sin dato</span>}</div>
      <div role="cell" className="min-w-0">
        {f.variedad ? (
          <span className="crop-tint inline-block max-w-full truncate rounded-md bg-crop-soft px-2 py-0.5 text-[12px] text-crop-ink">{titulo(f.variedad)}</span>
        ) : <span className="text-faint">Sin dato</span>}
      </div>
      <div role="cell" className="min-w-0">
        <div className="truncate">{f.exportador_principal ? titulo(f.exportador_principal) : '—'}</div>
        {f.exportadores > 1 && <div className="text-[12px] text-muted">y {f.exportadores - 1} más</div>}
      </div>
      <div role="cell" className="num text-right text-muted">{fmt(f.envios)}</div>
      <div role="cell" className="num text-right font-medium">{fmt1(f.t)}</div>
      <div role="cell"><Uso pct={f.uso_pct} /></div>
      <div role="cell" aria-hidden>
        <ChevronRight className={cn('size-4', seleccionada ? 'text-crop' : 'text-line group-hover:text-muted')} />
      </div>
    </div>
  );
}

function FilaMovil({ f, seleccionada, onAbrir }: { f: CampoFila; seleccionada: boolean; onAbrir: (clp: string) => void }) {
  return (
    <button onClick={() => onAbrir(f.clp)} className={cn('block w-full border-b border-line px-4 py-3 text-left text-[13px]', seleccionada && 'bg-crop-soft/70')}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{f.predio ? titulo(f.predio) : f.clp}</span>
        <span className="num shrink-0 font-medium">{fmt1(f.t)} t</span>
      </div>
      <div className="mt-0.5 flex gap-2 text-[12px] text-muted">
        <span className="num">{f.clp}</span>
        {f.region && <span>{titulo(f.region)}</span>}
      </div>
      <div className="mt-1 truncate text-[12px] text-muted">
        {f.exportador_principal ? titulo(f.exportador_principal) : ''}{f.exportadores > 1 ? ` y ${f.exportadores - 1} más` : ''}
      </div>
    </button>
  );
}

export function TablaCampos({
  filas, total, filtros, seleccionado, hayMas, cargandoMas, onCargarMas, onOrdenar, onAbrir,
}: {
  filas: CampoFila[];
  total: number;
  filtros: FiltrosCampos;
  seleccionado: string | null;
  hayMas: boolean;
  cargandoMas: boolean;
  onCargarMas: () => void;
  onOrdenar: (c: OrdenCampos) => void;
  onAbrir: (clp: string) => void;
}) {
  const escritorio = useMedia('(min-width: 768px)');
  const ref = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: filas.length,
    getScrollElement: () => ref.current,
    estimateSize: () => (escritorio ? 76 : 84),
    overscan: 12,
    getItemKey: (i) => filas[i].clp,
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
      aria-label="Campos certificados"
      aria-rowcount={total}
      className="scroll-thin relative h-[calc(100dvh-250px)] min-h-[480px] overflow-auto rounded-2xl border border-line bg-paper"
    >
      <div className={escritorio ? 'min-w-[1000px]' : undefined}>
        {escritorio && (
          <div role="row" className={cn(COLS, 'sticky top-0 z-10 border-b border-line bg-paper/95 px-5 py-2.5 text-[12px] text-muted backdrop-blur')}>
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
            const sel = f.clp === seleccionado;
            return (
              <div key={it.key} data-index={it.index} ref={v.measureElement}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${it.start}px)` }}>
                {escritorio ? <FilaEscritorio f={f} seleccionada={sel} onAbrir={onAbrir} /> : <FilaMovil f={f} seleccionada={sel} onAbrir={onAbrir} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-5 py-2.5 text-[12.5px] text-muted backdrop-blur">
        <span className="num">Mostrando {fmt(filas.length)} de {fmt(total)} campos</span>
        {cargandoMas ? (
          <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Cargando más</span>
        ) : (
          <span>Elige un campo para ver su ficha</span>
        )}
      </div>
    </div>
  );
}