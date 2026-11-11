import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { DashboardData, DashboardParams } from '@/types/agro';

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      if (USE_MOCKS) {
        const { dashboardMock } = await import('@/mocks/dashboard.mock');
        return dashboardMock(params);
      }
      return apiGet<DashboardData>('/dashboard', { ...params });
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}