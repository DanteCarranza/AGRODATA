import type { EstadoTraza } from '@/types/agro';

interface ConPesos {
  peso_kg: number;
  aporte_kg: number | null;
  campos: { clp: string }[];
}

export interface Traza {
  estado: EstadoTraza;
  /** 0 a 1: qué parte del peso embarcado está respaldada por campos */
  cobertura: number;
  /** kg embarcados que ningún campo respalda (solo en parcial) */
  sin_enlazar_kg: number;
  /** kg que aportaron los campos de más y se descartaron en planta (solo en completa) */
  merma_kg: number;
}

/** Diferencias de hasta 1% se consideran redondeo de la declaración, no fruta sin respaldo */
export const TOLERANCIA = 0.01;

/** Misma regla en el mock y en el backend: así la columna, el filtro y el detalle coinciden */
export function trazaDe(e: ConPesos): Traza {
  if (!e.campos.length || e.aporte_kg === null || e.aporte_kg <= 0) {
    return { estado: 'sin', cobertura: 0, sin_enlazar_kg: e.peso_kg, merma_kg: 0 };
  }
  if (e.aporte_kg >= e.peso_kg * (1 - TOLERANCIA)) {
    return { estado: 'completa', cobertura: 1, sin_enlazar_kg: 0, merma_kg: Math.max(0, e.aporte_kg - e.peso_kg) };
  }
  return { estado: 'parcial', cobertura: e.aporte_kg / e.peso_kg, sin_enlazar_kg: e.peso_kg - e.aporte_kg, merma_kg: 0 };
}

export const ETIQUETA_TRAZA: Record<EstadoTraza, string> = {
  completa: 'Completa',
  parcial: 'Parcial',
  sin: 'Sin campo',
};

/** Clases de color por estado (texto y barra) */
export const COLOR_TRAZA: Record<EstadoTraza, { texto: string; barra: string; fondo: string }> = {
  completa: { texto: 'text-ok', barra: 'bg-ok', fondo: 'bg-ok/10' },
  parcial: { texto: 'text-warn', barra: 'bg-warn', fondo: 'bg-warn/10' },
  sin: { texto: 'text-faint', barra: 'bg-faint', fondo: 'bg-surface' },
};