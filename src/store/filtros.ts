import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CropId, Periodo } from '@/types/agro';

interface FiltrosState extends Periodo {
  crop: CropId;
  setCrop: (c: CropId) => void;
  setPeriodo: (p: Partial<Periodo>) => void;
  limpiarPeriodo: () => void;
}

export const PERIODO_INICIAL: Periodo = { anio: null, mesIni: 1, mesFin: 12 };

export const useFiltros = create<FiltrosState>()(
  persist(
    (set) => ({
      crop: 'uva',
      ...PERIODO_INICIAL,
      setCrop: (crop) => set({ crop, ...PERIODO_INICIAL }),
      setPeriodo: (p) => set(p),
      limpiarPeriodo: () => set(PERIODO_INICIAL),
    }),
    { name: 'adc-filtros' },
  ),
);

export const periodoActivo = (p: Periodo) => p.anio !== null || p.mesIni !== 1 || p.mesFin !== 12;

export const mesEnRango = (mes: number, p: Periodo) =>
  p.mesFin >= p.mesIni ? mes >= p.mesIni && mes <= p.mesFin : mes >= p.mesIni || mes <= p.mesFin;