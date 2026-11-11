import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { CropId } from '@/types/agro';

export interface ResultadoBusqueda {
  tipo: 'exportador' | 'importador' | 'variedad' | 'destino' | 'campo';
  /** texto secundario (predio del campo) */
  detalle?: string;
  nombre: string;
  envios: number;
}

export function useBusqueda(crop: CropId, q: string) {
  return useQuery({
    queryKey: ['busqueda', crop, q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { busquedaMock } = await import('@/mocks/busqueda.mock');
        return busquedaMock(crop, q);
      }
      return apiGet<ResultadoBusqueda[]>('/busqueda', { crop, q });
    },
    placeholderData: keepPreviousData,
  });
}