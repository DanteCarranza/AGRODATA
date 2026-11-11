/**
 * Implementación en el navegador de:
 *   GET /api/comercio   -> ComercioData
 *
 * Totales y destinos: base oficial completa (agro.json, RAW.DB del prototipo).
 * Calendario de Perú: meses de embarque según los envíos.
 * Transporte y orgánico: solo limón trae ese procesamiento en el prototipo (COMINT_REAL).
 * Ventanas de competidores: referencia pública del sector; sus volúmenes llegarán con UN Comtrade.
 */
import type { ComercioData, CropId, ModoTransporte } from '@/types/agro';

interface Agro {
  kpis: { envios: number; campos: number; peso_t: number };
  dest: { n: string; e: number }[];
}

/** Meses activos entre dos meses (1-12), aunque crucen el año */
const rango = (ini: number, fin: number) => {
  const r: number[] = [];
  for (let m = ini; ; m = (m % 12) + 1) {
    r.push(m - 1);
    if (m === fin) return r;
  }
};
const TODO_EL_ANIO = rango(1, 12);

const COMPETIDORES: Record<CropId, { pais: string; meses: number[] }[]> = {
  uva: [
    { pais: 'CHILE', meses: rango(12, 5) },
    { pais: 'SUDAFRICA', meses: rango(12, 4) },
    { pais: 'MEXICO', meses: rango(5, 7) },
  ],
  palta: [
    { pais: 'MEXICO', meses: TODO_EL_ANIO },
    { pais: 'CHILE', meses: rango(9, 2) },
    { pais: 'COLOMBIA', meses: TODO_EL_ANIO },
  ],
  arandano: [
    { pais: 'CHILE', meses: rango(11, 3) },
    { pais: 'MEXICO', meses: rango(10, 6) },
    { pais: 'MARRUECOS', meses: rango(11, 5) },
  ],
  mango: [
    { pais: 'MEXICO', meses: rango(3, 9) },
    { pais: 'BRASIL', meses: TODO_EL_ANIO },
    { pais: 'ECUADOR', meses: rango(10, 12) },
  ],
  limon: [
    { pais: 'MEXICO', meses: TODO_EL_ANIO },
    { pais: 'BRASIL', meses: TODO_EL_ANIO },
    { pais: 'COLOMBIA', meses: TODO_EL_ANIO },
  ],
};

/** Procesamiento oficial de limón Tahití del prototipo (COMINT_REAL) */
const LIMON = {
  partida: { codigo: '0805.50.22.00', descripcion: 'Lima Tahití (limón Tahití, Citrus latifolia), fresca o seca' },
  transporte: { AEREO: 353, MARITIMO: 298343, TERRESTRE: 102681 } as Record<ModoTransporte, number>,
  transporte_x_destino: {
    EEUU: { AEREO: 165, MARITIMO: 119193 },
    CHILE: { AEREO: 7, MARITIMO: 3687, TERRESTRE: 102610 },
    INGLATERRA: { AEREO: 110, MARITIMO: 39917 },
    'PAISES BAJOS': { AEREO: 51, MARITIMO: 37149 },
    PANAMA: { AEREO: 0, MARITIMO: 36496 },
    'REPUBLICA DOMINICANA': { MARITIMO: 28335 },
  } as Record<string, Partial<Record<ModoTransporte, number>>>,
  organico: { No: { t: 127842, n: 5638 }, Si: { t: 1553, n: 84 } },
  exp_organicos: 19,
  exp_total: 247,
};

let cacheAgro: Record<string, Agro> | null = null;
let cacheEnv: Record<string, { filas: { mes: number; peso_kg: number }[] }> | null = null;
const latencia = () => new Promise((r) => setTimeout(r, 150));

const pcts = <K extends string>(o: Partial<Record<K, number>>) => {
  const tot = Object.values<number>(o as Record<K, number>).reduce((s, v) => s + v, 0) || 1;
  return Object.fromEntries(Object.entries<number>(o as Record<K, number>).map(([k, v]) => [k, (v / tot) * 100])) as Partial<Record<K, number>>;
};

export async function comercioMock(crop: CropId): Promise<ComercioData> {
  cacheAgro ??= (await import('./agro.json')).default as unknown as Record<string, Agro>;
  cacheEnv ??= (await import('./envios.json')).default as unknown as Record<string, { filas: { mes: number; peso_kg: number }[] }>;
  await latencia();
  const a = cacheAgro[crop];

  const totalEnvios = a.dest.reduce((s, d) => s + d.e, 0) || 1;
  const meses = Array(12).fill(0);
  cacheEnv[crop].filas.forEach((f) => (meses[f.mes - 1] += f.peso_kg));
  const totMeses = meses.reduce((s, v) => s + v, 0) || 1;

  const esLimon = crop === 'limon';
  const orden: ModoTransporte[] = ['MARITIMO', 'TERRESTRE', 'AEREO'];

  return {
    totales: { envios: a.kpis.envios, peso_t: a.kpis.peso_t, destinos: a.dest.length, campos: a.kpis.campos },
    partida: esLimon ? LIMON.partida : null,
    destinos: [...a.dest].sort((x, y) => y.e - x.e).slice(0, 10).map((d) => ({ n: d.n, envios: d.e, share: (d.e / totalEnvios) * 100 })),
    calendario: {
      peru: meses.map((v) => (v / totMeses) * 100),
      competidores: COMPETIDORES[crop],
    },
    transporte: esLimon
      ? {
          modos: orden.map((k) => ({ k, pct: pcts(LIMON.transporte)[k] ?? 0 })),
          por_destino: Object.entries(LIMON.transporte_x_destino).map(([n, m]) => ({ n, modos: pcts(m) })),
        }
      : null,
    organico: esLimon
      ? {
          pct_volumen: (LIMON.organico.Si.t / (LIMON.organico.Si.t + LIMON.organico.No.t)) * 100,
          envios_organicos: LIMON.organico.Si.n,
          envios_convencionales: LIMON.organico.No.n,
          exportadores_organicos: LIMON.exp_organicos,
          exportadores_total: LIMON.exp_total,
        }
      : null,
  };
}