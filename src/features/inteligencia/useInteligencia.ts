import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type {
  CropId, DetalleVariedad, IntelOportunidades, IntelParams, IntelSaturacion, IntelVariedades, VistaIntel,
} from '@/types/agro';

const opciones = { placeholderData: keepPreviousData, staleTime: 5 * 60_000 } as const;

export function useOportunidades(p: IntelParams, activo: boolean) {
  return useQuery({
    ...opciones,
    queryKey: ['intel-oportunidades', p],
    enabled: activo,
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/inteligencia.mock')).oportunidadesMock(p);
      return apiGet<IntelOportunidades>('/inteligencia/oportunidades', { ...p });
    },
  });
}

export function useSaturacion(p: IntelParams, activo: boolean) {
  return useQuery({
    ...opciones,
    queryKey: ['intel-saturacion', p],
    enabled: activo,
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/inteligencia.mock')).saturacionMock(p);
      return apiGet<IntelSaturacion>('/inteligencia/saturacion', { ...p });
    },
  });
}

export function useVariedades(p: IntelParams, activo: boolean) {
  return useQuery({
    ...opciones,
    queryKey: ['intel-variedades', p],
    enabled: activo,
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/inteligencia.mock')).variedadesMock(p);
      return apiGet<IntelVariedades>('/inteligencia/variedades', { ...p });
    },
  });
}

export function useDetalleVariedad(crop: CropId, anio: number | null, variedad: string | null) {
  return useQuery({
    ...opciones,
    queryKey: ['intel-variedad', crop, anio, variedad],
    enabled: !!variedad,
    queryFn: async () => {
      if (USE_MOCKS) return (await import('@/mocks/inteligencia.mock')).detalleVariedadMock(crop, anio, variedad!);
      return apiGet<DetalleVariedad | null>('/inteligencia/variedad', { crop, anio, variedad });
    },
  });
}

const VISTAS: VistaIntel[] = ['oportunidades', 'saturacion', 'variedades'];

/** Pestaña y selección en la URL (#/inteligencia?vista=saturacion&destino=EEUU) */
export function useVistaIntel() {
  const [sp, setSp] = useSearchParams();
  const v = sp.get('vista') as VistaIntel;
  const vista: VistaIntel = VISTAS.includes(v) ? v : 'oportunidades';

  const set = useCallback(
    (cambios: Record<string, string | null>) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([k, val]) => (val ? n.set(k, val) : n.delete(k)));
          return n;
        },
        { replace: true },
      ),
    [setSp],
  );

  return {
    vista,
    pais: sp.get('pais'),
    destino: sp.get('destino'),
    variedad: sp.get('variedad'),
    set,
  };
}