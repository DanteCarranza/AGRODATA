import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { SesionContext, useSesion } from '@/features/sesion/useSesion';

/** Sin sesión, a la pantalla de ingreso; al volver se retoma la página que se pidió */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, error, isPending, refetch } = useSesion();
  const { pathname, search } = useLocation();

  if (isPending) return null;
  if (error instanceof ApiError && error.status === 401) {
    const volver = pathname === '/' && !search ? '' : `?volver=${encodeURIComponent(pathname + search)}`;
    return <Navigate to={`/login${volver}`} replace />;
  }
  if (error || !data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface p-6">
        <div className="max-w-sm rounded-2xl border border-bad/30 bg-paper p-6 text-center">
          <p className="font-medium">No pudimos verificar tu sesión</p>
          <p className="mt-1 text-[13px] text-muted">{error?.message}. Revisa tu conexión.</p>
          <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
        </div>
      </div>
    );
  }
  return <SesionContext.Provider value={data}>{children}</SesionContext.Provider>;
}