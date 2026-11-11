import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { CamposPage, CamposParams, CropId, FichaCampo, Periodo } from '@/types/agro';

const TAM_PAGINA = 200;

export function useCampos(params: Omit<CamposParams, 'offset' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ['campos', params],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const p = { ...params, offset: pageParam, limit: TAM_PAGINA };
      if (USE_MOCKS) {
        const { camposMock } = await import('@/mocks/campos.mock');
        return camposMock(p);
      }
      return apiGet<CamposPage>('/campos', { ...p });
    },
    getNextPageParam: (ultima) => ultima.siguiente,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useFichaCampo(crop: CropId, clp: string | null, periodo: Periodo) {
  return useQuery({
    queryKey: ['ficha-campo', crop, clp, periodo],
    enabled: !!clp,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { fichaCampoMock } = await import('@/mocks/campos.mock');
        return fichaCampoMock(crop, clp!, periodo);
      }
      return apiGet<FichaCampo | null>(`/campos/${encodeURIComponent(clp!)}`, { crop, ...periodo });
    },
    staleTime: 5 * 60_000,
  });
}