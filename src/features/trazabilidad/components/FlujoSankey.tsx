import { useEffect, useMemo, useRef, useState } from 'react';
import { sankey, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from 'd3-sankey';
import type { Eslabon, TrazabilidadData } from '@/types/agro';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, titulo } from '@/lib/format';

type N = { id: string; n: string; col: 0 | 1 | 2 };
type L = { source: string; target: string; value: number };
type NodoS = SankeyNode<N, L>;
type EnlaceS = SankeyLink<N, L>;

const ALTO = 460;
const COLUMNAS = ['Región de origen', 'Variedad', 'Destino'];

const etiqueta = (d: N) => (d.id.endsWith(':otros') ? d.n : d.col === 2 ? nombrePais(d.n) : titulo(d.n));

/**
 * Región de origen -> variedad -> destino, en toneladas respaldadas por campo.
 * Pasar el cursor por un nodo resalta su recorrido; tocar un destino lo abre en el rastreador.
 */
export function FlujoSankey({ flujo, onElegir }: { flujo: TrazabilidadData['flujo']; onElegir: (tipo: Eslabon, n: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(900);
  const [activo, setActivo] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.max(720, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const grafo = useMemo(() => {
    if (!flujo.enlaces.length) return null;
    const gen = sankey<N, L>()
      .nodeId((d) => d.id)
      .nodeAlign((d) => (d as NodoS).col)
      .nodeWidth(10)
      .nodePadding(12)
      .nodeSort((a, b) => (a.id.endsWith(':otros') ? 1 : b.id.endsWith(':otros') ? -1 : (b.value ?? 0) - (a.value ?? 0)))
      .extent([[0, 20], [ancho, ALTO - 4]]);
    return gen({
      nodes: flujo.nodos.map((d) => ({ ...d })),
      links: flujo.enlaces.map((l) => ({ source: l.a, target: l.b, value: l.t })),
    });
  }, [flujo, ancho]);

  // Nodos y enlaces conectados al nodo bajo el cursor (hacia atrás y hacia adelante)
  const resaltado = useMemo(() => {
    if (!grafo || !activo) return null;
    const nodos = new Set<string>([activo]);
    const enlaces = new Set<EnlaceS>();
    const ir = (id: string, dir: 'source' | 'target') => {
      grafo.links.forEach((l) => {
        const desde = (dir === 'source' ? l.source : l.target) as unknown as NodoS;
        const hacia = (dir === 'source' ? l.target : l.source) as unknown as NodoS;
        if (desde.id === id && !enlaces.has(l)) {
          enlaces.add(l);
          nodos.add(hacia.id);
          ir(hacia.id, dir);
        }
      });
    };
    ir(activo, 'source');
    ir(activo, 'target');
    return { nodos, enlaces };
  }, [grafo, activo]);

  if (!grafo) {
    return <p className="py-10 text-center text-[13px] text-muted">No hay envíos con campo de origen en este periodo.</p>;
  }

  const camino = sankeyLinkHorizontal<N, L>();

  return (
    <div ref={ref} className="scroll-thin -mx-1 overflow-x-auto px-1">
      <svg width={ancho} height={ALTO} role="img" aria-label="Flujo de la fruta: región de origen, variedad y destino" className="block">
        {COLUMNAS.map((c, i) => (
          <text
            key={c}
            x={i === 0 ? 0 : i === 1 ? ancho / 2 : ancho}
            y={10}
            textAnchor={i === 0 ? 'start' : i === 1 ? 'middle' : 'end'}
            className="fill-muted text-[12px]"
          >
            {c}
          </text>
        ))}
        <g fill="none">
          {grafo.links.map((l, i) => {
            const on = resaltado?.enlaces.has(l);
            return (
              <path
                key={i}
                d={camino(l) ?? undefined}
                stroke="var(--color-crop)"
                strokeOpacity={resaltado ? (on ? 0.5 : 0.06) : 0.2}
                strokeWidth={Math.max(1, l.width ?? 1)}
                className="crop-tint transition-[stroke-opacity] duration-200"
              >
                <title>{`${etiqueta(l.source as NodoS)} → ${etiqueta(l.target as NodoS)}: ${fmt(l.value)} t`}</title>
              </path>
            );
          })}
        </g>
        {grafo.nodes.map((d) => {
          const x0 = d.x0 ?? 0, x1 = d.x1 ?? 0, y0 = d.y0 ?? 0, y1 = d.y1 ?? 0;
          const otros = d.id.endsWith(':otros');
          const clicable = !otros && d.col === 2;
          const apagado = resaltado && !resaltado.nodos.has(d.id);
          const derecha = d.col < 2;
          return (
            <g
              key={d.id}
              onMouseEnter={() => setActivo(d.id)}
              onMouseLeave={() => setActivo(null)}
              onClick={() => clicable && onElegir('destino', d.n)}
              className={cn('transition-opacity duration-200', clicable && 'cursor-pointer', apagado && 'opacity-30')}
            >
              <rect
                x={x0}
                y={y0}
                width={x1 - x0}
                height={Math.max(2, y1 - y0)}
                rx={2}
                fill={otros ? 'var(--color-faint)' : 'var(--color-crop)'}
                className="crop-tint"
              />
              {y1 - y0 > 9 && (
                <text
                  x={derecha ? x1 + 8 : x0 - 8}
                  y={(y0 + y1) / 2}
                  dy="0.35em"
                  textAnchor={derecha ? 'start' : 'end'}
                  className={cn('text-[12px]', otros ? 'fill-muted' : 'fill-ink')}
                  style={{ paintOrder: 'stroke', stroke: 'var(--color-paper)', strokeWidth: 3, strokeLinejoin: 'round' }}
                >
                  {etiqueta(d)}
                  <tspan className="num fill-muted" dx={6}>{fmt(d.value ?? 0)} t</tspan>
                </text>
              )}
              <title>{`${etiqueta(d)}: ${fmt(d.value ?? 0)} t`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}