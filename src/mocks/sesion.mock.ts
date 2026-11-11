import type { Sesion } from '@/types/agro';
import { cuentaActual, sesionDe } from './cuentas.mock';

/** Implementación en el navegador de GET /api/auth/me: 401 si no hay sesión */
export async function sesionMock(): Promise<Sesion> {
  return sesionDe(cuentaActual());
}