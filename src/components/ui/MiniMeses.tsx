import { MESES_LARGO } from '@/config/crops';
import { cn, fmt } from '@/lib/format';

const TONOS = {
  crop: { alto: 'bg-crop', bajo: 'bg-crop/35', vacio: 'bg-line' },
  menta: { alto: 'bg-mint', bajo: 'bg-mint/40', vacio: 'bg-white/15' },
};

/**
 * 12 barras diminutas (enero a diciembre) para leer la temporada de un vistazo dentro de una fila.
 * Los meses con al menos la mitad del máximo se pintan con el color fuerte.
 */
export function MiniMeses({
  meses, unidad = 't', tono = 'crop', className,
}: {
  meses: number[];
  unidad?: string;
  /** "menta" para fondos oscuros */
  tono?: keyof typeof TONOS;
  className?: string;
}) {
  const max = Math.max(...meses, 0);
  const c = TONOS[tono];
  return (
    <div
      className={cn('flex h-6 items-end gap-[2px]', className)}
      role="img"
      aria-label={`Meses de compra: ${meses.map((v, i) => (v ? MESES_LARGO[i].toLowerCase() : '')).filter(Boolean).join(', ') || 'sin datos'}`}
    >
      {meses.map((v, i) => (
        <span
          key={i}
          title={`${MESES_LARGO[i]}: ${fmt(v)} ${unidad}`}
          className={cn('crop-tint w-[5px] rounded-[1.5px]', !v ? c.vacio : v >= max / 2 ? c.alto : c.bajo)}
          style={{ height: v && max ? `${Math.max(18, (v / max) * 100)}%` : '12%' }}
        />
      ))}
    </div>
  );
}