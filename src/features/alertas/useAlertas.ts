import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { AlertasData, AlertasParams } from '@/types/agro';

export function useAlertas(p: AlertasParams) {
  return useQuery({
    queryKey: ['alertas', p],
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/alertas.mock')).alertasMock(p);
      return apiGet<AlertasData>('/alertas', { ...p, soloCultivo: p.soloCultivo ? 1 : 0 });
    },
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000,
  });
}

/** Filtros en la URL (#/alertas-sanitarias?cultivo=1&pais=ESPAÑA). Por defecto: todos los productos peruanos */
export function useFiltrosAlertas() {
  const [sp, setSp] = useSearchParams();
  const set = useCallback(
    (cambios: Record<string, string | null>) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
          return n;
        },
        { replace: true },
      ),
    [setSp],
  );
  return { soloCultivo: sp.get('cultivo') === '1', pais: sp.get('pais'), set };
}