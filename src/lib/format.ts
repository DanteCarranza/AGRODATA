const nf = new Intl.NumberFormat('es-PE');
const nf1 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });

export const fmt = (n: number) => nf.format(Math.round(n));
export const fmt1 = (n: number) => nf1.format(n);

/** 171955 -> "172 mil", 2284753 -> "2,3 M" */
export const fmtCorto = (n: number) => {
  if (n >= 1_000_000) return `${nf1.format(n / 1_000_000)} M`;
  if (n >= 10_000) return `${nf.format(Math.round(n / 1000))} mil`;
  return nf.format(Math.round(n));
};

const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'of']);
const SIGLAS = new Set(['sac', 'saa', 'sa', 'srl', 'eirl', 'llc', 'inc', 'bv', 'gmbh', 'usa', 'uk', 'ltd', 'spa', 'sl']);
const ESPECIALES: Record<string, string> = { eeuu: 'EE. UU.', inc: 'Inc.', 'inc.': 'Inc.', ltd: 'Ltd.', 'ltd.': 'Ltd.', gmbh: 'GmbH' };

/** "PAISES BAJOS" -> "Paises Bajos", "CAMPOSOL S.A." -> "Camposol S.A.", "JOY PRODUCE LLC" -> "Joy Produce LLC" */
export const titulo = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const low = w.toLowerCase();
      if (ESPECIALES[low]) return ESPECIALES[low];
      if (/^([a-z]\.)+[a-z]?\.?$/i.test(w)) return w.toUpperCase(); // S.A.C. B.V. F-V
      if (SIGLAS.has(low.replace(/[.,]/g, ''))) return w.toUpperCase();
      if (i > 0 && /^(ii|iii|iv|vi|vii|viii|ix|xi|xii)$/i.test(w)) return w.toUpperCase(); // Fundo Altior II
      if (i > 0 && MENORES.has(low)) return low;
      return low.replace(/(^|[-(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()); // Jack's, no Jack'S
    })
    .join(' ');

/** Cierra una frase con punto sin duplicarlo ("hacia EE. UU." no queda "UU..") */
export const frase = (s: string) => (s.endsWith('.') ? s : `${s}.`);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');