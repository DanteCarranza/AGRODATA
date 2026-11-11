import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn, fmt1 } from '@/lib/format';

/** Cambio de participación en puntos porcentuales: ▲ 4.8 / ▼ 2.1 / = */
export function Delta({ pp, className }: { pp: number | null | undefined; className?: string }) {
  if (pp === null || pp === undefined) return null;
  const plano = Math.abs(pp) < 0.5;
  const Icono = plano ? Minus : pp > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-0.5 text-[12px]',
        plano ? 'text-faint' : pp > 0 ? 'text-ok' : 'text-bad',
        className,
      )}
      title={plano ? 'Sin cambio relevante frente al periodo anterior' : `${pp > 0 ? '+' : ''}${fmt1(pp)} puntos de participación frente al periodo anterior`}
    >
      <Icono className="size-3.5" aria-hidden />
      {plano ? 'igual' : fmt1(Math.abs(pp))}
    </span>
  );
}