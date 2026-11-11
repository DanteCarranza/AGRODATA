import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, USE_MOCKS } from '@/lib/api';
import type { CropId, RespuestaSolicitud, SolicitudSuscripcion, SuscripcionData } from '@/types/agro';

export function useSuscripcion(crop: CropId) {
  return useQuery({
    queryKey: ['suscripcion', crop],
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/suscripcion.mock')).suscripcionMock({ crop });
      return apiGet<SuscripcionData>('/suscripcion', { crop });
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Renovar, cambiar de plan, pedir una campaña o agregar un cultivo: el backend lo registra y el área comercial confirma */
export function useSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: SolicitudSuscripcion) => {
      if (USE_MOCKS) return (await import('@/mocks/suscripcion.mock')).solicitudMock(b);
      return apiPost<RespuestaSolicitud>('/suscripcion/solicitudes', b);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suscripcion'] }),
  });
}