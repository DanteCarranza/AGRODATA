import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { AccesoData, CropId } from '@/types/agro';

export function useAcceso(crop: CropId, destino: string | null) {
  return useQuery({
    queryKey: ['acceso', crop, destino],
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/acceso.mock')).accesoMock(crop, destino);
      return apiGet<AccesoData>('/acceso', { crop, destino });
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 60_000,
  });
}

/** Mercado elegido en la URL (#/acceso?destino=CHINA) */
export function useDestinoAcceso() {
  const [sp, setSp] = useSearchParams();
  const setDestino = useCallback(
    (d: string) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set('destino', d);
          return n;
        },
        { replace: true },
      ),
    [setSp],
  );
  return { destino: sp.get('destino'), setDestino };
}