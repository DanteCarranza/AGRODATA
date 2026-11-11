import { useEffect, useState } from 'react';
import { Download, Loader2, Search, X } from 'lucide-react';
import type { Conteo, FiltrosEnvios } from '@/types/agro';
import { useDebounced } from '@/lib/hooks';
import { cn, fmt, titulo } from '@/lib/format';

function Selector({
  etiqueta, todos, valor, opciones, onCambio,
}: {
  etiqueta: string;
  todos: string;
  valor: string | null;
  opciones: Conteo[];
  onCambio: (v: string | null) => void;
}) {
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
          <option key={o.n} value={o.n}>
            {titulo(o.n)} ({fmt(o.envios)})
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ texto, onQuitar }: { texto: string; onQuitar: () => void }) {
  return (
    <button
      onClick={onQuitar}
      className="crop-tint inline-flex max-w-full items-center gap-1.5 rounded-full bg-crop-soft py-1 pr-2 pl-3 text-[12.5px] text-crop-ink hover:brightness-95"
    >
      <span className="truncate">{texto}</span>
      <X className="size-3.5 shrink-0" aria-label="Quitar" />
    </button>
  );
}

export function BarraFiltros({
  filtros, facetas, activos, exportando, onCambio, onLimpiar, onExportar,
}: {
  filtros: FiltrosEnvios;
  facetas?: { variedades: Conteo[]; destinos: Conteo[] };
  activos: boolean;
  exportando: boolean;
  onCambio: (c: Partial<Record<'q' | 'variedad' | 'destino' | 'exportador' | 'importador', string | null>>) => void;
  onLimpiar: () => void;
  onExportar: () => void;
}) {
  // El texto se escribe localmente y se manda a la URL 300 ms después de dejar de teclear
  const [texto, setTexto] = useState(filtros.q);
  const debounced = useDebounced(texto);
  useEffect(() => {
    setTexto(filtros.q);
  }, [filtros.q]);
  useEffect(() => {
    if (debounced !== filtros.q) onCambio({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-auto sm:min-w-[240px] sm:flex-[2]">
          <span className="sr-only">Buscar en la hoja</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Exportador, importador, CLP, predio, planta o expediente"
            className="w-full rounded-lg border border-line bg-paper py-2 pr-3 pl-9 text-[13.5px] placeholder:text-faint"
          />
        </label>
        <Selector etiqueta="Variedad" todos="Todas las variedades" valor={filtros.variedad} opciones={facetas?.variedades ?? []} onCambio={(v) => onCambio({ variedad: v })} />
        <Selector etiqueta="Destino" todos="Todos los destinos" valor={filtros.destino} opciones={facetas?.destinos ?? []} onCambio={(v) => onCambio({ destino: v })} />
        <button
          onClick={onExportar}
          disabled={exportando}
          className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] hover:border-faint disabled:opacity-60"
        >
          {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Descargar CSV
        </button>
      </div>

      {(filtros.exportador || filtros.importador || activos) && (
        <div className="flex flex-wrap items-center gap-2">
          {filtros.exportador && <Chip texto={`Exportador: ${titulo(filtros.exportador)}`} onQuitar={() => onCambio({ exportador: null })} />}
          {filtros.importador && <Chip texto={`Importador: ${titulo(filtros.importador)}`} onQuitar={() => onCambio({ importador: null })} />}
          {activos && (
            <button onClick={onLimpiar} className="px-1 text-[12.5px] text-muted hover:text-ink hover:underline">
              Quitar todos los filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}