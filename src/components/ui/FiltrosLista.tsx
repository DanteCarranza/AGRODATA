import { useEffect, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import type { Conteo } from '@/types/agro';
import { useDebounced } from '@/lib/hooks';
import { cn, fmt, titulo } from '@/lib/format';

export interface SelectorDef {
  etiqueta: string;
  /** texto de la opción vacía ("Todos los países") */
  todos: string;
  valor: string | null;
  opciones: Conteo[];
  onCambio: (v: string | null) => void;
}

function Selector({ etiqueta, todos, valor, opciones, onCambio }: SelectorDef) {
  return (
    <label className="min-w-[140px] flex-1 sm:flex-none">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor ?? ''}
        onChange={(e) => onCambio(e.target.value || null)}
        className={cn(
          'crop-tint w-full rounded-lg border px-3 py-2 text-[13px] sm:w-48',
          valor ? 'border-crop bg-crop-soft text-crop-ink' : 'border-line bg-paper',
        )}
      >
        <option value="">{todos}</option>
        {valor && !opciones.some((o) => o.n === valor) && <option value={valor}>{titulo(valor)}</option>}
        {opciones.map((o) => (
          <option key={o.n} value={o.n}>{titulo(o.n)} ({fmt(o.envios)})</option>
        ))}
      </select>
    </label>
  );
}

/**
 * Barra de búsqueda + selectores + descarga CSV, común a las listas (importadores, y luego las demás).
 * El texto se manda 300 ms después de dejar de escribir.
 */
export function FiltrosLista({
  q, placeholder, onQ, selectores, activos, onLimpiar, exportando, onExportar,
}: {
  q: string;
  placeholder: string;
  onQ: (q: string | null) => void;
  selectores: SelectorDef[];
  activos: boolean;
  onLimpiar: () => void;
  exportando: boolean;
  onExportar: () => void;
}) {
  const [texto, setTexto] = useState(q);
  const debounced = useDebounced(texto);
  useEffect(() => {
    setTexto(q);
  }, [q]);
  useEffect(() => {
    if (debounced !== q) onQ(debounced || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-auto sm:min-w-[240px] sm:flex-[2]">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-line bg-paper py-2 pr-3 pl-9 text-[13.5px] placeholder:text-faint"
          />
        </label>
        {selectores.map((s) => <Selector key={s.etiqueta} {...s} />)}
        <button
          onClick={onExportar}
          disabled={exportando}
          className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] hover:border-faint disabled:opacity-60"
        >
          {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Descargar CSV
        </button>
      </div>
      {activos && (
        <button onClick={onLimpiar} className="px-1 text-[12.5px] text-muted hover:text-ink hover:underline">
          Quitar todos los filtros
        </button>
      )}
    </div>
  );
}