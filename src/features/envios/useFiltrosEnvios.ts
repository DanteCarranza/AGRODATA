import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EstadoTraza, FiltrosEnvios, OrdenEnvios } from '@/types/agro';

const ORDENES: OrdenEnvios[] = ['fecha', 'exportador', 'importador', 'peso', 'traza', 'destino'];
const ESTADOS: EstadoTraza[] = ['completa', 'parcial', 'sin'];
export type ClaveFiltro = 'q' | 'variedad' | 'destino' | 'exportador' | 'importador' | 'traza' | 'ficha' | 'envio';

/**
 * Los filtros de la hoja viven en la URL (#/envios?destino=EEUU&traza=parcial&envio=...),
 * así un enlace copiado abre exactamente la misma vista, incluso el detalle abierto.
 */
export function useFiltrosEnvios() {
  const [sp, setSp] = useSearchParams();

  const filtros: FiltrosEnvios = useMemo(() => {
    const orden = sp.get('orden') as OrdenEnvios;
    const traza = sp.get('traza') as EstadoTraza;
    return {
      q: sp.get('q') ?? '',
      variedad: sp.get('variedad'),
      destino: sp.get('destino'),
      exportador: sp.get('exportador'),
      importador: sp.get('importador'),
      traza: ESTADOS.includes(traza) ? traza : null,
      orden: ORDENES.includes(orden) ? orden : 'fecha',
      dir: sp.get('dir') === 'asc' ? 'asc' : 'desc',
    };
  }, [sp]);

  const ficha = sp.get('ficha');
  const envio = sp.get('envio');

  const set = useCallback(
    (cambios: Partial<Record<ClaveFiltro | 'orden' | 'dir', string | null>>) => {
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
          return n;
        },
        { replace: true },
      );
    },
    [setSp],
  );

  const ordenarPor = useCallback(
    (col: OrdenEnvios) => {
      const textual = col === 'exportador' || col === 'importador' || col === 'destino';
      if (filtros.orden === col) set({ dir: filtros.dir === 'asc' ? 'desc' : 'asc' });
      else set({ orden: col, dir: textual ? 'asc' : 'desc' });
    },
    [filtros.orden, filtros.dir, set],
  );

  const limpiar = useCallback(
    () => set({ q: null, variedad: null, destino: null, exportador: null, importador: null, traza: null }),
    [set],
  );

  const activos =
    !!filtros.q || !!filtros.variedad || !!filtros.destino || !!filtros.exportador || !!filtros.importador || !!filtros.traza;

  return { filtros, ficha, envio, set, ordenarPor, limpiar, activos };
}