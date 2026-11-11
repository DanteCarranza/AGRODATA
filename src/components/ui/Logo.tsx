import { cn } from '@/lib/format';

/** Hoja de AgroDataCore con el nombre; claro sobre fondo oscuro u oscuro sobre fondo claro */
export function Logo({ tono = 'claro', className }: { tono?: 'claro' | 'oscuro'; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#17332a" />
        <path d="M9 22c0-7 5-12 14-12-1 8-6 13-14 12z" fill="var(--color-mint)" />
        <path d="M9 22l8-7" stroke="#17332a" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <div className={cn('font-display text-[17px] font-semibold tracking-tight', tono === 'claro' ? 'text-white' : 'text-ink')}>AgroDataCore</div>
        <div className={cn('text-[11.5px]', tono === 'claro' ? 'text-[#8aa398]' : 'text-muted')}>Inteligencia agroexportadora</div>
      </div>
    </div>
  );
}