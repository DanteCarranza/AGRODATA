import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { CropId, FichaImportador, ImportadoresPage, ImportadoresParams, Periodo } from '@/types/agro';

const TAM_PAGINA = 200;

export function useImportadores(params: Omit<ImportadoresParams, 'offset' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ['importadores', params],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const p = { ...params, offset: pageParam, limit: TAM_PAGINA };
      if (USE_MOCKS) {
        const { importadoresMock } = await import('@/mocks/importadores.mock');
        return importadoresMock(p);
      }
      return apiGet<ImportadoresPage>('/importadores', { ...p });
    },
    getNextPageParam: (ultima) => ultima.siguiente,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useFichaImportador(crop: CropId, nombre: string | null, periodo: Periodo) {
  return useQuery({
    queryKey: ['ficha-importador', crop, nombre, periodo],
    enabled: !!nombre,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { fichaImportadorMock } = await import('@/mocks/importadores.mock');
        return fichaImportadorMock(crop, nombre!, periodo);
      }
      return apiGet<FichaImportador | null>('/importadores/ficha', { crop, nombre, ...periodo });
    },
    staleTime: 5 * 60_000,
  });
}