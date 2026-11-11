import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { NAV_FLAT } from '@/config/nav';
import { ApiError } from '@/lib/api';
import EnMigracion from '@/pages/EnMigracion';

const AuthLayout = lazy(() => import('@/features/auth/AuthLayout'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegistroPage = lazy(() => import('@/features/auth/RegistroPage'));
const RecuperarPage = lazy(() => import('@/features/auth/RecuperarPage'));
const RestablecerPage = lazy(() => import('@/features/auth/RestablecerPage'));

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const EnviosPage = lazy(() => import('@/features/envios/EnviosPage'));
const CamposPage = lazy(() => import('@/features/campos/CamposPage'));
const ImportadoresPage = lazy(() => import('@/features/importadores/ImportadoresPage'));
const TrazabilidadPage = lazy(() => import('@/features/trazabilidad/TrazabilidadPage'));
const BalancePage = lazy(() => import('@/features/balance/BalancePage'));
const InteligenciaPage = lazy(() => import('@/features/inteligencia/InteligenciaPage'));
const ComercioPage = lazy(() => import('@/features/comercio/ComercioPage'));
const AccesoPage = lazy(() => import('@/features/acceso/AccesoPage'));
const AlertasPage = lazy(() => import('@/features/alertas/AlertasPage'));
const InformePage = lazy(() => import('@/features/informe/InformePage'));
const SuscripcionPage = lazy(() => import('@/features/suscripcion/SuscripcionPage'));

const MIGRADOS = new Set(['/', '/envios', '/campos', '/ranking', '/trazabilidad', '/balance', '/inteligencia', '/comercio', '/acceso', '/alertas-sanitarias', '/alertas-fitosanitarias', '/informe', '/suscripcion']);

const queryClient: QueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  // Si cualquier consulta responde 401 (sesión vencida en el servidor), se vuelve a verificar la sesión y RequireAuth manda al ingreso
  queryCache: new QueryCache({
    onError: (e, q) => {
      if (e instanceof ApiError && e.status === 401 && q.queryKey[0] !== 'sesion') {
        queryClient.invalidateQueries({ queryKey: ['sesion'] });
      }
    },
  }),
});

const s = (el: ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

// Hash router: funciona detrás de cualquier hosting estático sin reglas de reescritura.
// En el VPS con Nginx/Caddy se puede cambiar a createBrowserRouter + try_files.
const router = createHashRouter([
  {
    element: s(<AuthLayout />),
    children: [
      { path: '/login', element: s(<LoginPage />) },
      { path: '/registro', element: s(<RegistroPage />) },
      { path: '/recuperar', element: s(<RecuperarPage />) },
      { path: '/restablecer', element: s(<RestablecerPage />) },
    ],
  },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: s(<DashboardPage />) },
      { path: '/envios', element: s(<EnviosPage />) },
      { path: '/campos', element: s(<CamposPage />) },
      { path: '/ranking', element: s(<ImportadoresPage />) },
      { path: '/trazabilidad', element: s(<TrazabilidadPage />) },
      { path: '/balance', element: s(<BalancePage />) },
      { path: '/inteligencia', element: s(<InteligenciaPage />) },
      { path: '/comercio', element: s(<ComercioPage />) },
      { path: '/acceso', element: s(<AccesoPage />) },
      { path: '/alertas-sanitarias', element: s(<AlertasPage key="sanitaria" tipo="sanitaria" />) },
      { path: '/alertas-fitosanitarias', element: s(<AlertasPage key="fitosanitaria" tipo="fitosanitaria" />) },
      { path: '/informe', element: s(<InformePage />) },
      { path: '/suscripcion', element: s(<SuscripcionPage />) },
      ...NAV_FLAT.filter((n) => !MIGRADOS.has(n.to)).map((n) => ({ path: n.to, element: <EnMigracion /> })),
      { path: '*', element: <EnMigracion /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}