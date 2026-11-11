import { ArrowDownRight, ArrowUpRight, Minus, Sparkles, Moon } from 'lucide-react';
import type { Tendencia } from '@/types/agro';
import { cn, fmt1 } from '@/lib/format';

export const TENDENCIAS: { k: Tendencia; titulo: string; detalle: string }[] = [
  { k: 'crece', titulo: 'Crecen', detalle: 'Ganan al menos 25% de participación' },
  { k: 'estable', titulo: 'Estables', detalle: 'Se mantienen en su nivel' },
  { k: 'cae', titulo: 'Caen', detalle: 'Pierden al menos 25% de participación' },
  { k: 'nuevo', titulo: 'Nuevos', detalle: 'Su primera compra es de este periodo' },
  { k: 'inactivo', titulo: 'Dejaron de comprar', detalle: 'Compraban antes y ahora no' },
];

export const ESTILO: Record<Tendencia, { etiqueta: string; pill: string; barra: string; icono: typeof Minus }> = {
  crece: { etiqueta: 'Crece', pill: 'bg-ok/10 text-ok', barra: 'bg-ok', icono: ArrowUpRight },
  estable: { etiqueta: 'Estable', pill: 'bg-line/70 text-muted', barra: 'bg-faint', icono: Minus },
  cae: { etiqueta: 'Cae', pill: 'bg-bad/10 text-bad', barra: 'bg-bad', icono: ArrowDownRight },
  nuevo: { etiqueta: 'Nuevo', pill: 'crop-tint bg-crop-soft text-crop-ink', barra: 'crop-tint bg-crop', icono: Sparkles },
  inactivo: { etiqueta: 'Dejó de comprar', pill: 'bg-surface text-muted ring-1 ring-line', barra: 'bg-muted/40', icono: Moon },
};

/** Pastilla de tendencia con el cambio en puntos de participación debajo */
export function TendenciaBadge({ t, pp, compacto }: { t: Tendencia | null; pp?: number | null; compacto?: boolean }) {
  if (!t) {
    return compacto ? null : (
      <span className="text-[13px] text-faint" title="Menos de 3 envíos en alguno de los dos periodos: no se puede clasificar">—</span>
    );
  }
  const e = ESTILO[t];
  const Icono = e.icono;
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={cn('inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-[12px] font-medium', e.pill)}>
        <Icono className="size-3.5" aria-hidden />
        {e.etiqueta}
      </span>
      {!compacto && pp !== null && pp !== undefined && (t === 'crece' || t === 'cae' || t === 'estable') && (
        <span className="num pl-1 text-[11.5px] text-faint">
          {Math.abs(pp) < 0.05 ? 'sin cambio' : `${pp > 0 ? '+' : ''}${fmt1(pp)} pts`}
        </span>
      )}
    </span>
  );
}