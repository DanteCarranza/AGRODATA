import { MESES } from '@/config/crops';

/** Meses que suman al menos el 70% de las compras, en orden de temporada (dic antes que ene) */
export function mesesClave(meses: number[]) {
  const total = meses.reduce((s, v) => s + v, 0);
  if (!total) return { lista: [] as number[], pct: 0 };
  const orden = meses.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const lista: number[] = [];
  let acum = 0;
  for (const m of orden) {
    if (acum / total >= 0.7) break;
    lista.push(m.i);
    acum += m.v;
  }
  const cruzaAnio = lista.includes(11) && lista.includes(0);
  lista.sort((a, b) => (cruzaAnio ? ((a + 6) % 12) - ((b + 6) % 12) : a - b));
  return { lista, pct: (acum / total) * 100 };
}

/** "Dic – Feb", "Mar" o "Todo el año" */
export function rangoTemporada(meses: number[]) {
  const { lista } = mesesClave(meses);
  if (!lista.length) return '';
  if (lista.length >= 7) return 'Todo el año';
  if (lista.length === 1) return MESES[lista[0]];
  return `${MESES[lista[0]]} – ${MESES[lista[lista.length - 1]]}`;
}