import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { Cadena, CropId, Eslabon, Periodo, TrazabilidadData, TrazabilidadParams } from '@/types/agro';

export function useTrazabilidad(params: TrazabilidadParams) {
  return useQuery({
    queryKey: ['trazabilidad', params],
    queryFn: async () => {
      if (USE_MOCKS) {
        const { trazabilidadMock } = await import('@/mocks/trazabilidad.mock');
        return trazabilidadMock(params);
      }
      return apiGet<TrazabilidadData>('/trazabilidad', { ...params });
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useCadena(crop: CropId, periodo: Periodo, foco: { tipo: Eslabon; n: string } | null) {
  return useQuery({
    queryKey: ['cadena', crop, periodo, foco],
    enabled: !!foco,
    queryFn: async () => {
      if (USE_MOCKS) {
        const { cadenaMock } = await import('@/mocks/trazabilidad.mock');
        return cadenaMock(crop, periodo, foco!.tipo, foco!.n);
      }
      return apiGet<Cadena | null>('/trazabilidad/cadena', { crop, ...periodo, tipo: foco!.tipo, n: foco!.n });
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

const ESLABONES: Eslabon[] = ['campo', 'planta', 'exportador', 'importador', 'destino'];

/** Eslabón elegido en el rastreador, guardado en la URL (#/trazabilidad?tipo=importador&n=...) */
export function useFoco() {
  const [sp, setSp] = useSearchParams();
  const tipo = sp.get('tipo') as Eslabon;
  const n = sp.get('n');
  const foco = n && ESLABONES.includes(tipo) ? { tipo, n } : null;

  const setFoco = useCallback(
    (f: { tipo: Eslabon; n: string } | null) =>
      setSp(
        (prev) => {
          const x = new URLSearchParams(prev);
          if (f) {
            x.set('tipo', f.tipo);
            x.set('n', f.n);
          } else {
            x.delete('tipo');
            x.delete('n');
          }
          return x;
        },
        { replace: true },
      ),
    [setSp],
  );
  return { foco, setFoco };
}