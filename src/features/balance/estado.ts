import type { EstadoSaldo } from '@/types/agro';
import { MESES } from '@/config/crops';

/** Semáforo del certificado. Los cortes son los del balance oficial (uso del certificado en %) */
export const ESTADO_SALDO: Record<EstadoSaldo, { titulo: string; rango: string; texto: string; barra: string; fondo: string }> = {
  alto: { titulo: 'Saldo alto', rango: 'menos de 50%', texto: 'text-ok', barra: 'bg-ok', fondo: 'bg-ok/10' },
  uso: { titulo: 'En uso', rango: '50% a 89%', texto: 'crop-tint text-crop', barra: 'crop-tint bg-crop', fondo: 'crop-tint bg-crop-soft' },
  agotado: { titulo: 'Casi agotado', rango: '90% a 100%', texto: 'text-warn', barra: 'bg-warn', fondo: 'bg-warn/10' },
  sobregiro: { titulo: 'Sobregiro', rango: 'más de 100%', texto: 'text-bad', barra: 'bg-bad', fondo: 'bg-bad/10' },
};

export const ORDEN_ESTADOS: EstadoSaldo[] = ['alto', 'uso', 'agotado', 'sobregiro'];

/** "2026-06-30" -> "30 jun 2026" */
export const fecha = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1].toLowerCase()} ${a}`;
};