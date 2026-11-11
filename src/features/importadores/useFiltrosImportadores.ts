import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FiltrosImportadores, OrdenImportadores, Tendencia } from '@/types/agro';

const ORDENES: OrdenImportadores[] = ['toneladas', 'envios', 'tendencia', 'proveedores', 'nombre'];
const TENDENCIAS: Tendencia[] = ['crece', 'estable', 'cae', 'nuevo', 'inactivo'];
export type ClaveImportadores = 'q' | 'pais' | 'variedad' | 'tendencia' | 'importador';

/** Filtros del ranking en la URL (#/ranking?pais=EEUU&tendencia=crece&importador=...) */
export function useFiltrosImportadores() {
  const [sp, setSp] = useSearchParams();

  const filtros: FiltrosImportadores = useMemo(() => {
    const orden = sp.get('orden') as OrdenImportadores;
    const t = sp.get('tendencia') as Tendencia;
    return {
      q: sp.get('q') ?? '',
      pais: sp.get('pais'),
      variedad: sp.get('variedad'),
      tendencia: TENDENCIAS.includes(t) ? t : null,
      orden: ORDENES.includes(orden) ? orden : 'toneladas',
      dir: sp.get('dir') === 'asc' ? 'asc' : 'desc',
    };
  }, [sp]);

  const importador = sp.get('importador');

  const set = useCallback(
    (cambios: Partial<Record<ClaveImportadores | 'orden' | 'dir', string | null>>) => {
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
    (col: OrdenImportadores) => {
      if (filtros.orden === col) set({ dir: filtros.dir === 'asc' ? 'desc' : 'asc' });
      else set({ orden: col, dir: col === 'nombre' ? 'asc' : 'desc' });
    },
    [filtros.orden, filtros.dir, set],
  );

  const limpiar = useCallback(() => set({ q: null, pais: null, variedad: null, tendencia: null }), [set]);
  const activos = !!filtros.q || !!filtros.pais || !!filtros.variedad || !!filtros.tendencia;

  return { filtros, importador, set, ordenarPor, limpiar, activos };
}