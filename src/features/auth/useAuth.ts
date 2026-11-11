import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, USE_MOCKS } from '@/lib/api';
import type { LoginBody, PerfilUsuario, RegistroBody, Sesion } from '@/types/agro';
import { useAvisos } from '@/store/avisos';

const mocks = () => import('@/mocks/auth.mock');

/** Al entrar se guarda la sesión en caché: la app no vuelve a pedir /auth/me */
function useEntrar<B>(fn: (b: B) => Promise<Sesion>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (s) => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'sesion' });
      qc.setQueryData(['sesion'], s);
    },
  });
}

export const useLogin = () =>
  useEntrar((b: LoginBody) => (USE_MOCKS ? mocks().then((m) => m.loginMock(b)) : apiPost<Sesion>('/auth/login', b)));

/** Solo en modo demo */
export const useLoginDemo = () => useEntrar((id: string) => mocks().then((m) => m.loginDemoMock(id)));

export const useRegistro = () =>
  useEntrar((b: RegistroBody) => (USE_MOCKS ? mocks().then((m) => m.registroMock(b)) : apiPost<Sesion>('/auth/registro', b)));

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => (USE_MOCKS ? mocks().then((m) => m.logoutMock()) : apiPost<{ ok: boolean }>('/auth/logout', {})),
    onSettled: () => {
      qc.clear();
      useAvisos.setState({ lista: [] });
    },
  });
}

export const useRecuperar = () =>
  useMutation({
    mutationFn: (b: { correo: string }) =>
      USE_MOCKS ? mocks().then((m) => m.recuperarMock(b)) : apiPost<{ ok: boolean }>('/auth/recuperar', b),
  });

export const useRestablecer = () =>
  useMutation({
    mutationFn: (b: { token: string; clave: string }) =>
      USE_MOCKS ? mocks().then((m) => m.restablecerMock(b)) : apiPost<{ ok: boolean }>('/auth/restablecer', b),
  });

export function useCambiarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (perfil: PerfilUsuario) =>
      USE_MOCKS ? mocks().then((m) => m.perfilMock({ perfil })) : apiPost<Sesion>('/auth/perfil', { perfil }),
    onSuccess: (s) => qc.setQueryData(['sesion'], s),
  });
}