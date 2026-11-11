import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Compradores, FiltrosCampos, OrdenCampos } from '@/types/agro';

const ORDENES: OrdenCampos[] = ['toneladas', 'envios', 'exportadores', 'uso', 'clp'];
const GRUPOS: Compradores[] = ['uno', 'pocos', 'muchos'];
export type ClaveCampos = 'q' | 'region' | 'variedad' | 'compradores' | 'campo';

/** Filtros de Campos en la URL (#/campos?region=PIURA&compradores=muchos&campo=016-02093-01) */
export function useFiltrosCampos() {
  const [sp, setSp] = useSearchParams();

  const filtros: FiltrosCampos = useMemo(() => {
    const orden = sp.get('orden') as OrdenCampos;
    const comp = sp.get('compradores') as Compradores;
    return {
      q: sp.get('q') ?? '',
      region: sp.get('region'),
      variedad: sp.get('variedad'),
      compradores: GRUPOS.includes(comp) ? comp : null,
      orden: ORDENES.includes(orden) ? orden : 'toneladas',
      dir: sp.get('dir') === 'asc' ? 'asc' : 'desc',
    };
  }, [sp]);

  const campo = sp.get('campo');

  const set = useCallback(
    (cambios: Partial<Record<ClaveCampos | 'orden' | 'dir', string | null>>) => {
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
    (col: OrdenCampos) => {
      if (filtros.orden === col) set({ dir: filtros.dir === 'asc' ? 'desc' : 'asc' });
      else set({ orden: col, dir: col === 'clp' ? 'asc' : 'desc' });
    },
    [filtros.orden, filtros.dir, set],
  );

  const limpiar = useCallback(() => set({ q: null, region: null, variedad: null, compradores: null }), [set]);
  const activos = !!filtros.q || !!filtros.region || !!filtros.variedad || !!filtros.compradores;

  return { filtros, campo, set, ordenarPor, limpiar, activos };
}