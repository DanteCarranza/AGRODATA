import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { InformeData, InformeParams } from '@/types/agro';

export function useInforme(p: InformeParams) {
  return useQuery({
    queryKey: ['informe', p],
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/informe.mock')).informeMock(p);
      return apiGet<InformeData>('/informe', { ...p });
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

/** Variedad del informe en la URL (#/informe?variedad=RED%20GLOBE); sin ella, el informe es del cultivo */
export function useVariedadInforme() {
  const [sp, setSp] = useSearchParams();
  const setVariedad = useCallback(
    (v: string | null) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (v) n.set('variedad', v);
          else n.delete('variedad');
          return n;
        },
        { replace: true },
      ),
    [setSp],
  );
  return { variedad: sp.get('variedad'), setVariedad };
}