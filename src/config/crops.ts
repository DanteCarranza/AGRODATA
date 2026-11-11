import type { CropId } from '@/types/agro';

export interface CropDef {
  id: CropId;
  nombre: string;
  /** Ventana típica de campaña en Perú (meses), referencial */
  campana: string;
}

export const CROPS: CropDef[] = [
  { id: 'uva', nombre: 'Uva de mesa', campana: 'Oct – Mar' },
  { id: 'palta', nombre: 'Palta', campana: 'Mar – Sep' },
  { id: 'arandano', nombre: 'Arándano', campana: 'Jul – Dic' },
  { id: 'mango', nombre: 'Mango', campana: 'Nov – Mar' },
  { id: 'limon', nombre: 'Limón Tahití', campana: 'Todo el año' },
];

export const cropById = (id: CropId) => CROPS.find((c) => c.id === id)!;

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
export const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
];