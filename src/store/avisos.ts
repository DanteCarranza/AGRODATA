import { create } from 'zustand';

export interface Aviso {
  id: number;
  texto: string;
  tono: 'ok' | 'error' | 'info';
  /** enlace opcional dentro de la app ("Ver planes") */
  accion?: { texto: string; to: string };
}

interface AvisosState {
  lista: Aviso[];
  mostrar: (a: Omit<Aviso, 'id'>) => void;
  quitar: (id: number) => void;
}

let n = 0;

/** Avisos flotantes de toda la app (abajo a la derecha) */
export const useAvisos = create<AvisosState>()((set) => ({
  lista: [],
  mostrar: (a) => set((s) => ({ lista: [...s.lista.filter((x) => x.texto !== a.texto).slice(-2), { ...a, id: ++n }] })),
  quitar: (id) => set((s) => ({ lista: s.lista.filter((x) => x.id !== id) })),
}));

/** Para usar fuera de componentes */
export const avisar = (a: Omit<Aviso, 'id'>) => useAvisos.getState().mostrar(a);