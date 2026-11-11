import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { ComercioData, CropId } from '@/types/agro';

export function useComercio(crop: CropId) {
  return useQuery({
    queryKey: ['comercio', crop],
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/comercio.mock')).comercioMock(crop);
      return apiGet<ComercioData>('/comercio', { crop });
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 60_000,
  });
}