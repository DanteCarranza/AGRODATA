import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Loader2 } from 'lucide-react';
import type { Envio, FiltrosEnvios, OrdenEnvios } from '@/types/agro';
import { MESES } from '@/config/crops';
import { useMedia } from '@/lib/hooks';
import { cn, fmt, titulo } from '@/lib/format';
import { COLOR_TRAZA, ETIQUETA_TRAZA, trazaDe } from '../traza';

type Acciones = {
  onDetalle: (id: string) => void;
  onFicha: (exportador: string) => void;
  onFiltro: (c: Partial<Record<'variedad' | 'destino' | 'importador', string>>) => void;
};

const COLS =
  'grid grid-cols-[72px_minmax(180px,1.25fr)_minmax(170px,1.2fr)_108px_96px_140px_minmax(140px,1fr)_16px] gap-x-3';

const CABECERA: { label: string; orden?: OrdenEnvios; num?: boolean; ayuda?: string }[] = [
  { label: 'Mes', orden: 'fecha' },
  { label: 'Exportador', orden: 'exportador' },
  { label: 'Comprador y destino', orden: 'importador' },
  { label: 'Variedad' },
  { label: 'Peso neto', orden: 'peso', num: true },
  { label: 'Trazabilidad', orden: 'traza', ayuda: 'Parte del peso embarcado que respaldan los campos declarados' },
  { label: 'Planta y origen' },
  { label: '' },
];

const fecha = (e: Envio) => `${MESES[e.mes - 1]} ${e.anio}`;
/** Evita que un clic en un enlace interno abra también el detalle de la fila */
const solo = (fn: () => void) => (ev: MouseEvent) => {
  ev.stopPropagation();
  fn();
};

function Trazabilidad({ e }: { e: Envio }) {
  const t = trazaDe(e);
  const c = COLOR_TRAZA[t.estado];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className={cn('font-medium', c.texto)}>{ETIQUETA_TRAZA[t.estado]}</span>
        {t.estado !== 'sin' && <span className="num text-muted">{Math.round(t.cobertura * 100)}%</span>}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={cn('h-full rounded-full', c.barra)} style={{ width: `${t.cobertura * 100}%` }} />
      </div>
      <div className="mt-1 text-[11.5px] text-faint">
        {e.campos.length} {e.campos.length === 1 ? 'campo' : 'campos'}
      </div>
    </div>
  );
}

function FilaEscritorio({ e, seleccionada, onDetalle, onFicha, onFiltro }: { e: Envio; seleccionada: boolean } & Acciones) {
  const abrir = () => onDetalle(e.id);
  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={seleccionada}
      onClick={abrir}
      onKeyDown={(ev: KeyboardEvent) => ev.key === 'Enter' && abrir()}
      className={cn(
        COLS,
        'group cursor-pointer items-center border-b border-line px-5 py-3 text-[13px] outline-offset-[-2px]',
        seleccionada ? 'crop-tint bg-crop-soft/70' : 'hover:bg-surface/80',
      )}
    >
      <div role="cell" className="num text-muted">{fecha(e)}</div>
      <div role="cell" className="min-w-0">
        <button onClick={solo(() => onFicha(e.exportador))} className="block max-w-full truncate text-left font-medium hover:text-crop hover:underline" title="Ver ficha del exportador">
          {titulo(e.exportador)}
        </button>
        <div className="num truncate text-[11.5px] text-faint">Exp. {e.exp}</div>
      </div>
      <div role="cell" className="min-w-0">
        {e.importador ? (
          <button onClick={solo(() => onFiltro({ importador: e.importador }))} className="block max-w-full truncate text-left hover:text-crop hover:underline" title="Filtrar por este importador">
            {titulo(e.importador)}
          </button>
        ) : <span className="text-faint">Importador sin dato</span>}
        <button onClick={solo(() => onFiltro({ destino: e.destino }))} className="block max-w-full truncate text-left text-[12px] text-muted hover:text-crop hover:underline" title="Filtrar por este destino">
          {titulo(e.destino)}
        </button>
      </div>
      <div role="cell" className="min-w-0">
        {e.variedad ? (
          <button onClick={solo(() => onFiltro({ variedad: e.variedad }))} className="crop-tint max-w-full truncate rounded-md bg-crop-soft px-2 py-0.5 text-[12px] text-crop-ink hover:brightness-95">
            {titulo(e.variedad)}
          </button>
        ) : <span className="text-faint">Sin dato</span>}
      </div>
      <div role="cell" className="num text-right font-medium">
        {fmt(e.peso_kg)}
        <span className="ml-0.5 text-[11.5px] font-normal text-muted">kg</span>
      </div>
      <div role="cell"><Trazabilidad e={e} /></div>
      <div role="cell" className="min-w-0">
        <div className="truncate" title={e.planta}>{e.planta ? titulo(e.planta) : '—'}</div>
        <div className="truncate text-[12px] text-muted">{e.origen ? titulo(e.origen) : 'Origen sin dato'}</div>
      </div>
      <div role="cell" aria-hidden>
        <ChevronRight className={cn('size-4 transition-colors', seleccionada ? 'text-crop' : 'text-line group-hover:text-muted')} />
      </div>
    </div>
  );
}

function FilaMovil({ e, seleccionada, onDetalle }: { e: Envio; seleccionada: boolean } & Acciones) {
  const t = trazaDe(e);
  return (
    <button
      onClick={() => onDetalle(e.id)}
      className={cn('block w-full border-b border-line px-4 py-3 text-left text-[13px]', seleccionada && 'bg-crop-soft/70')}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{titulo(e.exportador)}</span>
        <span className="num shrink-0 font-medium">{fmt(e.peso_kg)} kg</span>
      </div>
      <div className="mt-0.5 truncate text-muted">
        {e.importador ? `${titulo(e.importador)}, ` : ''}{titulo(e.destino)}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[12px]">
        <span className="num text-muted">{fecha(e)}</span>
        {e.variedad && <span className="truncate text-crop-ink">{titulo(e.variedad)}</span>}
        <span className={cn('ml-auto shrink-0 font-medium', COLOR_TRAZA[t.estado].texto)}>
          {ETIQUETA_TRAZA[t.estado]}{t.estado !== 'sin' && ` ${Math.round(t.cobertura * 100)}%`}
        </span>
      </div>
    </button>
  );
}

export function HojaEnvios({
  filas, total, filtros, seleccionado, cargandoMas, hayMas, onCargarMas, onOrdenar, ...acciones
}: {
  filas: Envio[];
  total: number;
  filtros: FiltrosEnvios;
  seleccionado: string | null;
  cargandoMas: boolean;
  hayMas: boolean;
  onCargarMas: () => void;
  onOrdenar: (c: OrdenEnvios) => void;
} & Acciones) {
  const escritorio = useMedia('(min-width: 768px)');
  const ref = useRef<HTMLDivElement>(null);

  const v = useVirtualizer({
    count: filas.length,
    getScrollElement: () => ref.current,
    estimateSize: () => (escritorio ? 72 : 88),
    overscan: 12,
    getItemKey: (i) => filas[i].id,
  });

  // Al cambiar filtros u orden, volver arriba (abrir un detalle o una ficha no cuenta como cambio)
  const clave = JSON.stringify(filtros);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [clave]);

  // Carga la siguiente página cuando faltan pocas filas para el final
  const items = v.getVirtualItems();
  const ultimo = items[items.length - 1]?.index ?? 0;
  useEffect(() => {
    if (hayMas && !cargandoMas && ultimo >= filas.length - 20) onCargarMas();
  }, [ultimo, filas.length, hayMas, cargandoMas, onCargarMas]);

  return (
    <div
      ref={ref}
      role="table"
      aria-label="Hoja de envíos"
      aria-rowcount={total}
      className="scroll-thin relative h-[calc(100dvh-250px)] min-h-[480px] overflow-auto rounded-2xl border border-line bg-paper"
    >
      <div className={escritorio ? 'min-w-[1040px]' : undefined}>
        {escritorio && (
          <div role="row" className={cn(COLS, 'sticky top-0 z-10 border-b border-line bg-paper/95 px-5 py-2.5 text-[12px] text-muted backdrop-blur')}>
            {CABECERA.map((c, i) => {
              const activa = c.orden && filtros.orden === c.orden;
              const Icono = !activa ? ArrowUpDown : filtros.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <div
                  key={i}
                  role="columnheader"
                  title={c.ayuda}
                  aria-sort={activa ? (filtros.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(c.num && 'text-right')}
                >
                  {c.orden ? (
                    <button
                      onClick={() => onOrdenar(c.orden!)}
                      className={cn('inline-flex items-center gap-1 hover:text-ink', activa && 'font-medium text-ink')}
                    >
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
            const e = filas[it.index];
            const sel = e.id === seleccionado;
            return (
              <div
                key={it.key}
                data-index={it.index}
                ref={v.measureElement}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${it.start}px)` }}
              >
                {escritorio
                  ? <FilaEscritorio e={e} seleccionada={sel} {...acciones} />
                  : <FilaMovil e={e} seleccionada={sel} {...acciones} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-5 py-2.5 text-[12.5px] text-muted backdrop-blur">
        <span className="num">
          Mostrando {fmt(filas.length)} de {fmt(total)} envíos
        </span>
        {cargandoMas ? (
          <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Cargando más</span>
        ) : hayMas ? (
          <span>Baja para cargar más</span>
        ) : (
          <span>Elige una fila para ver el certificado completo</span>
        )}
      </div>
    </div>
  );
}