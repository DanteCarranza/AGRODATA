import { avisar } from '@/store/avisos';

/**
 * Modo solo lectura (suscripción vencida): se puede consultar, pero no descargar.
 * AppShell lo activa según la sesión; el backend debe rechazar igual las exportaciones.
 */
let soloLectura = false;

export const setSoloLectura = (v: boolean) => {
  soloLectura = v;
};

/** Llamar antes de cualquier descarga o impresión. Si está bloqueado, avisa y devuelve false. */
export function puedeDescargar() {
  if (!soloLectura) return true;
  avisar({
    tono: 'error',
    texto: 'Tu suscripción venció: puedes consultar, pero las descargas están desactivadas.',
    accion: { texto: 'Renovar suscripción', to: '/suscripcion' },
  });
  return false;
}