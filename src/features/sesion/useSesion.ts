import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiGet, USE_MOCKS } from '@/lib/api';
import type { Sesion } from '@/types/agro';

export function useSesion() {
  return useQuery({
    queryKey: ['sesion'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const { sesionMock } = await import('@/mocks/sesion.mock');
        return sesionMock();
      }
      return apiGet<Sesion>('/auth/me');
    },
    staleTime: Infinity,
    // 401 = no hay sesión: no tiene sentido reintentar
    retry: (n, e) => !(e instanceof ApiError && e.status === 401) && n < 1,
  });
}

/** RequireAuth la entrega ya cargada; al cerrar sesión conserva el último valor mientras la app se desmonta */
export const SesionContext = createContext<Sesion | null>(null);

/** Sesión garantizada dentro de la app (detrás de RequireAuth) */
export function useSesionActiva(): Sesion {
  const s = useContext(SesionContext);
  if (!s) throw new Error('useSesionActiva fuera de RequireAuth');
  return s;
}

/** Días que faltan para que venza la suscripción (negativo si ya venció) */
export const diasParaVencer = (vence: string) =>
  Math.ceil((new Date(`${vence}T23:59:59`).getTime() - Date.now()) / 86_400_000);