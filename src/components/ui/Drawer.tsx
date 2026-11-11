import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Panel lateral derecho para fichas y detalles.
 * Se cierra con Escape, con la X o haciendo clic fuera. Bloquea el scroll de la página mientras está abierto.
 */
export function Drawer({
  abierto, onCerrar, etiqueta, titulo, subtitulo, children, pie,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** texto pequeño sobre el título ("Ficha del exportador") */
  etiqueta: string;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={etiqueta}>
      <div className="absolute inset-0 bg-forest/35" onClick={onCerrar} />
      <aside className="drawer-in absolute inset-y-0 right-0 flex w-[min(560px,100vw)] flex-col bg-paper shadow-[-24px_0_48px_-24px_rgba(14,34,25,.35)]">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="text-[12.5px] text-muted">{etiqueta}</p>
            <h2 className="mt-0.5 font-display text-[24px] leading-tight font-semibold tracking-tight">{titulo}</h2>
            {subtitulo && <div className="mt-1 text-[13px] text-muted">{subtitulo}</div>}
          </div>
          <button ref={cerrarRef} onClick={onCerrar} className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {pie && <footer className="border-t border-line px-6 py-4">{pie}</footer>}
      </aside>
    </div>
  );
}