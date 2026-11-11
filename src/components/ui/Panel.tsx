import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export function Panel({
  titulo,
  detalle,
  accion,
  children,
  className,
}: {
  titulo: string;
  detalle?: ReactNode;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-line bg-paper', className)}>
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div>
          <h2 className="font-display text-[16px] font-semibold tracking-tight">{titulo}</h2>
          {detalle && <p className="mt-0.5 text-[12.5px] text-muted">{detalle}</p>}
        </div>
        {accion}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-line/70', className)} />;
}