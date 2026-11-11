import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { CropId, Envio, EnviosPage, EnviosParams, FichaExportador, Periodo } from '@/types/agro';

export const TAM_PAGINA = 200;

export function useEnvios(params: Omit<EnviosParams, 'offset' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ['envios', params],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const p = { ...params, offset: pageParam, limit: TAM_PAGINA };
      if (USE_MOCKS) {
        const { enviosMock } = await import('@/mocks/envios.mock');
        return enviosMock(p);
      }
      return apiGet<EnviosPage>('/envios', { ...p });
    },
    getNextPageParam: (ultima) => ultima.siguiente,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useEnvio(crop: CropId, id: string | null) {
  return useQuery({
    queryKey: ['envio', crop, id],
    enabled: !!id,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { envioMock } = await import('@/mocks/envios.mock');
        return envioMock(crop, id!);
      }
      return apiGet<Envio | null>(`/envios/${encodeURIComponent(id!)}`, { crop });
    },
    staleTime: 5 * 60_000,
  });
}

export function useFichaExportador(crop: CropId, nombre: string | null, periodo: Periodo) {
  return useQuery({
    queryKey: ['ficha-exportador', crop, nombre, periodo],
    enabled: !!nombre,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { fichaExportadorMock } = await import('@/mocks/envios.mock');
        return fichaExportadorMock(crop, nombre!, periodo);
      }
      return apiGet<FichaExportador | null>('/exportadores/ficha', { crop, nombre, ...periodo });
    },
  });
}