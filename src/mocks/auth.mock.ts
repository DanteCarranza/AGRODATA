/**
 * Implementación en el navegador de:
 *   POST /api/auth/login        {correo, clave, recordar}  -> Sesion       (401 si no coincide)
 *   POST /api/auth/logout                                  -> {ok}
 *   POST /api/auth/registro     RegistroBody               -> Sesion       (409 si el correo ya existe)
 *   POST /api/auth/recuperar    {correo}                   -> {ok}         (responde igual exista o no el correo)
 *   POST /api/auth/restablecer  {token, clave}             -> {ok}         (400 si el enlace venció)
 *   POST /api/auth/perfil       {perfil}                   -> Sesion
 *
 * En la demo cualquier contraseña de 8 o más caracteres entra; un correo que no es de demo entra como Profesional.
 */
import type { LoginBody, PerfilUsuario, RegistroBody, Sesion } from '@/types/agro';
import { ApiError } from '@/lib/api';
import { DEMOS, cuentaActual, guardarCuenta, isoDias, sesionDe } from './cuentas.mock';

const espera = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const correoDemo = (correo: string) => DEMOS.find((d) => d.crear().correo === correo.trim().toLowerCase());

export async function loginMock(b: LoginBody): Promise<Sesion> {
  await espera();
  if (b.clave.length < 8) throw new ApiError(401, 'Correo o contraseña incorrectos');
  const demo = correoDemo(b.correo) ?? DEMOS[0];
  const cuenta = demo.crear();
  if (!correoDemo(b.correo)) cuenta.correo = b.correo.trim().toLowerCase();
  guardarCuenta(cuenta);
  return sesionDe(cuenta);
}

/** Atajo de la pantalla de ingreso: entra directo con una cuenta de demostración */
export async function loginDemoMock(id: string): Promise<Sesion> {
  await espera(250);
  const cuenta = (DEMOS.find((d) => d.id === id) ?? DEMOS[0]).crear();
  guardarCuenta(cuenta);
  return sesionDe(cuenta);
}

export async function logoutMock() {
  await espera(150);
  guardarCuenta(null);
  return { ok: true };
}

export async function registroMock(b: RegistroBody): Promise<Sesion> {
  await espera(700);
  if (correoDemo(b.correo)) throw new ApiError(409, 'Ese correo ya tiene una cuenta. Ingresa o recupera tu contraseña.');
  const cuenta = {
    id: 'registro',
    nombre: b.nombre.trim(),
    correo: b.correo.trim().toLowerCase(),
    empresa: b.empresa.trim(),
    perfil: b.perfil,
    plan: 'profesional' as const,
    prueba: true,
    cultivos: [b.cultivo],
    facturacion: 'mensual' as const,
    inicio: isoDias(0),
    vence: isoDias(6), // 7 días contando hoy
    desbloqueadas: [],
    solicitadas: [],
  };
  guardarCuenta(cuenta);
  return sesionDe(cuenta);
}

export async function recuperarMock(b: { correo: string }) {
  await espera(600);
  void b; // el backend envía el correo solo si existe, pero responde igual en ambos casos
  return { ok: true };
}

export async function restablecerMock(b: { token: string; clave: string }) {
  await espera(600);
  if (!b.token) throw new ApiError(400, 'El enlace no es válido o ya venció. Pide uno nuevo.');
  return { ok: true };
}

export async function perfilMock(b: { perfil: PerfilUsuario }): Promise<Sesion> {
  await espera(200);
  const cuenta = { ...cuentaActual(), perfil: b.perfil };
  guardarCuenta(cuenta);
  return sesionDe(cuenta);
}