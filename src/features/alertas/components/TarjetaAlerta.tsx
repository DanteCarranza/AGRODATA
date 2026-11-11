import { Link } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Alerta, CropId } from '@/types/agro';
import { MESES } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn } from '@/lib/format';
import { CATEGORIA } from '../config';

const GRAVEDAD = {
  alta: 'bg-bad/10 text-bad',
  media: 'bg-warn/10 text-warn',
  baja: 'bg-surface text-muted',
};

/** Una notificación: fecha, producto, qué se encontró, quién la notificó y qué hacer con eso */
export function TarjetaAlerta({ a, crop, etiquetaPeligro }: { a: Alerta; crop: CropId; etiquetaPeligro: string }) {
  const [anio, mes, dia] = a.fecha.split('-').map(Number);
  const cat = CATEGORIA[a.categoria];
  const Icono = cat.icono;
  const tuyo = a.cultivo === crop;
  const q = encodeURIComponent;

  return (
    <article
      className={cn(
        'crop-tint grid gap-4 rounded-2xl border bg-paper p-4 sm:grid-cols-[72px_1fr_auto] sm:items-start sm:p-5',
        tuyo ? 'border-crop/40 shadow-[inset_3px_0_0_var(--color-crop)]' : 'border-line',
      )}
    >
      <div className="flex items-baseline gap-2 sm:block sm:text-center">
        <div className="num font-display text-[28px] leading-none font-semibold">{dia}</div>
        <div className="text-[12px] text-muted">{MESES[mes - 1].toLowerCase()} {anio}</div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('crop-tint rounded-md px-2 py-0.5 text-[12.5px] font-medium', tuyo ? 'bg-crop text-white' : 'bg-surface text-ink')}>{a.producto}</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', GRAVEDAD[a.gravedad])}>{a.tipo}</span>
          {a.ejemplo && <span className="rounded-full border border-dashed border-warn/50 px-2 py-0.5 text-[11.5px] text-warn">Ejemplo</span>}
        </div>
        <div className="mt-2 text-[12px] text-muted">{etiquetaPeligro}</div>
        <h3 className="text-[16px] leading-snug font-semibold">{a.peligro}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Icono className="size-3.5" aria-hidden />{cat.l}</span>
          <span className="inline-flex items-center gap-1.5"><Bandera pais={a.notificante} />Notificó {nombrePais(a.notificante)}</span>
          {a.referencia && <span className="num">Ref. {a.referencia}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] sm:flex-col sm:items-end sm:text-right">
        {tuyo && (
          <Link to={`/envios?destino=${q(a.notificante)}`} className="crop-tint inline-flex items-center gap-1 font-medium text-crop hover:underline">
            Envíos a {nombrePais(a.notificante)} <ArrowUpRight className="size-3.5" />
          </Link>
        )}
        {a.categoria === 'plaguicidas' && (
          <Link to={`/acceso?destino=${q(a.notificante)}`} className="crop-tint inline-flex items-center gap-1 text-crop hover:underline">
            Límites de ese mercado <ArrowUpRight className="size-3.5" />
          </Link>
        )}
        {a.enlace && (
          <a href={a.enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-ink">
            Ver en la fuente <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}