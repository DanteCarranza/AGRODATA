import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, USE_MOCKS } from '@/lib/api';
import type { BalanceData, BalanceParams, EstadoSaldo, FiltrosBalance, OrdenBalance } from '@/types/agro';

export function useBalance(params: BalanceParams) {
  return useQuery({
    queryKey: ['balance', params],
    queryFn: async () => {
      if (USE_MOCKS) {
        const { balanceMock } = await import('@/mocks/balance.mock');
        return balanceMock(params);
      }
      return apiGet<BalanceData>('/balance', { ...params });
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

const ESTADOS: EstadoSaldo[] = ['alto', 'uso', 'agotado', 'sobregiro'];
const ORDENES: OrdenBalance[] = ['saldo', 'uso', 'certificado'];

/** Filtros del balance en la URL (#/balance?estado=agotado&region=ICA) */
export function useFiltrosBalance() {
  const [sp, setSp] = useSearchParams();

  const filtros: FiltrosBalance = useMemo(() => {
    const e = sp.get('estado') as EstadoSaldo;
    const o = sp.get('orden') as OrdenBalance;
    return {
      q: sp.get('q') ?? '',
      region: sp.get('region'),
      estado: ESTADOS.includes(e) ? e : null,
      orden: ORDENES.includes(o) ? o : 'saldo',
    };
  }, [sp]);

  const set = useCallback(
    (cambios: Partial<Record<keyof FiltrosBalance, string | null>>) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          Object.entries(cambios).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
          return n;
        },
        { replace: true },
      ),
    [setSp],
  );

  const limpiar = useCallback(() => set({ q: null, region: null, estado: null }), [set]);
  const activos = !!filtros.q || !!filtros.region || !!filtros.estado;
  return { filtros, set, limpiar, activos };
}