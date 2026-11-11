/**
 * Implementación en el navegador de:
 *   GET /api/acceso?crop&destino   -> AccesoData
 *
 * Comercio con el mercado: real (base oficial y envíos).
 * Requisitos fitosanitarios: los del prototipo (REQ_FITO), que eran ejemplos estructurales.
 * Van marcados como "referencial" hasta que el backend los traiga de la consulta oficial de SENASA.
 * LMR: solo la norma que rige en cada mercado; los límites por plaguicida vendrán de la base de LMR.
 */
import type { AccesoData, CropId } from '@/types/agro';

type Fito = { cat: number; trata: string[]; decl: string[]; insp: string };

const REQ_FITO: Partial<Record<CropId, Record<string, Fito>>> = {
  uva: {
    EEUU: { cat: 3, trata: ['Tratamiento de frío (cold treatment) aprobado por APHIS'], decl: ['Libre de Lobesia botrana', 'Origen de campos registrados oficialmente'], insp: 'Inspección en origen (preclearance APHIS)' },
    CHINA: { cat: 3, trata: ['Tratamiento de frío', 'Fumigación si se detecta plaga'], decl: ['Protocolo Perú-China para uva', 'Empacadora y campo registrados ante GACC'], insp: 'Inspección conjunta; requiere registro CIFER' },
    'UNION EUROPEA': { cat: 3, trata: [], decl: ['Libre de plagas cuarentenarias de la UE'], insp: 'Inspección fitosanitaria en origen' },
  },
  palta: {
    EEUU: { cat: 3, trata: ['Plan de trabajo APHIS para palta Hass'], decl: ['Campos y planta de empaque registrados', 'Libre de plagas cuarentenarias'], insp: 'Inspección en origen' },
    CHINA: { cat: 3, trata: ['Tratamiento según protocolo'], decl: ['Protocolo Perú-China para palta', 'Registro CIFER de instalaciones'], insp: 'Inspección y registro GACC' },
    'UNION EUROPEA': { cat: 3, trata: [], decl: ['Libre de plagas cuarentenarias de la UE'], insp: 'Inspección en origen' },
  },
  arandano: { EEUU: { cat: 3, trata: ['Plan de trabajo systems approach'], decl: ['Campos registrados'], insp: 'Inspección en origen' } },
  mango: { EEUU: { cat: 3, trata: ['Tratamiento hidrotérmico obligatorio'], decl: ['Libre de mosca de la fruta'], insp: 'Tratamiento y certificación' } },
  limon: { EEUU: { cat: 3, trata: ['Systems approach para cítricos'], decl: ['Libre de mosca de la fruta'], insp: 'Inspección en origen' } },
};

/** Miembros de la UE que aparecen en la data: se rigen por los requisitos comunitarios */
const UE = new Set(['PAISES BAJOS', 'ESPAÑA', 'ESPANA', 'ALEMANIA', 'FRANCIA', 'ITALIA', 'BELGICA', 'PORTUGAL', 'POLONIA', 'GRECIA', 'LITUANIA', 'MARTINICA', 'GUADALUPE', 'GUYANA FRANCESA']);

const NORMA_LMR: Record<string, string> = {
  EEUU: 'US EPA, 40 CFR 180',
  CHINA: 'GB 2763',
  'UNION EUROPEA': 'EU Pesticides Database (Reglamento CE 396/2005)',
  JAPON: 'Lista positiva del MHLW',
};

const REFERENCIAL = { estado: 'referencial' as const, fuente: 'Prototipo AgroDataCore (ejemplo estructural)', verificado: null };

let cacheAgro: Record<string, { dest: { n: string; e: number }[] }> | null = null;
let cacheEnv: Record<string, { filas: { anio: number; destino: string; exportador: string }[] }> | null = null;
const latencia = () => new Promise((r) => setTimeout(r, 150));

export async function accesoMock(crop: CropId, destinoPedido: string | null): Promise<AccesoData> {
  cacheAgro ??= (await import('./agro.json')).default as unknown as Record<string, { dest: { n: string; e: number }[] }>;
  cacheEnv ??= (await import('./envios.json')).default as unknown as Record<string, { filas: { anio: number; destino: string; exportador: string }[] }>;
  await latencia();

  const destinos = [...cacheAgro[crop].dest].sort((a, b) => b.e - a.e).map((d) => ({ n: d.n, envios: d.e }));
  const destino = destinoPedido && destinos.some((d) => d.n === destinoPedido) ? destinoPedido : destinos[0]?.n ?? 'EEUU';
  const rige = UE.has(destino) ? 'UNION EUROPEA' : null;
  const clave = rige ?? destino;

  const total = destinos.reduce((s, d) => s + d.envios, 0) || 1;
  const oficial = destinos.find((d) => d.n === destino);
  const propias = cacheEnv[crop].filas.filter((f) => f.destino === destino);

  const fito = REQ_FITO[crop]?.[clave];
  const otros: AccesoData['otros'] = [];
  if (destino === 'CHINA') otros.push({ ...REFERENCIAL, texto: 'Registro de campos y plantas de empaque ante la aduana china (GACC), mediante el sistema CIFER' });

  return {
    destino,
    rige,
    destinos,
    comercio: oficial
      ? {
          envios: oficial.envios,
          share: (oficial.envios / total) * 100,
          exportadores: new Set(propias.map((f) => f.exportador)).size,
          desde: propias.length ? Math.min(...propias.map((f) => f.anio)) : null,
        }
      : null,
    fitosanitario: fito
      ? { ...REFERENCIAL, certificado: true, categoria: fito.cat, tratamientos: fito.trata, declaraciones: fito.decl, inspeccion: fito.insp }
      : null,
    lmr: { norma: NORMA_LMR[clave] ?? 'Codex Alimentarius, si el país no tiene norma propia', analitos: [] },
    otros,
  };
}