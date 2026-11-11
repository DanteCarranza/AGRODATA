import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/format';

/** Popover liviano: cierra con clic afuera o Escape */
export function Popover({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: (p: { abierto: boolean; toggle: () => void }) => ReactNode;
  children: (cerrar: () => void) => ReactNode;
  align?: 'start' | 'end';
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      {trigger({ abierto, toggle: () => setAbierto((v) => !v) })}
      {abierto && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 rounded-xl border border-line bg-paper p-4 shadow-[0_12px_32px_-12px_rgba(14,34,25,.28)]',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}