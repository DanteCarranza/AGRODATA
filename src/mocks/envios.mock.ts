/**
 * Implementación en el navegador de:
 *   GET /api/envios               -> EnviosPage (paginado)
 *   GET /api/envios/:id           -> Envio
 *   GET /api/envios/exportar      -> CSV
 *   GET /api/exportadores/ficha   -> FichaExportador
 * El backend NestJS debe respetar estas mismas formas.
 */
import type {
  Conteo, CropId, Envio, EnviosParams, EnviosPage, EstadoTraza, FichaExportador, FiltrosEnvios, Periodo,
} from '@/types/agro';
import { mesEnRango } from '@/store/filtros';
import { trazaDe } from '@/features/envios/traza';

type FilaMock = Omit<Envio, 'campos'> & { campos: { clp: string; kg: number | null }[] };
type CropEnvios = { filas: FilaMock[]; predios: Record<string, string> };

let cache: Record<string, CropEnvios> | null = null;
const cargar = async () => (cache ??= (await import('./envios.json')).default as unknown as Record<string, CropEnvios>);

const latencia = () => new Promise((r) => setTimeout(r, 150));

const enPeriodo = (f: FilaMock, p: Periodo) => (p.anio === null || f.anio === p.anio) && mesEnRango(f.mes, p);

type Omitible = 'variedad' | 'destino' | 'traza';

function filtrar(filas: FilaMock[], p: Periodo & Partial<FiltrosEnvios>, predios: Record<string, string>, omitir?: Omitible) {
  const q = p.q?.trim().toLowerCase();
  return filas.filter((f) => {
    if (!enPeriodo(f, p)) return false;
    if (omitir !== 'variedad' && p.variedad && f.variedad !== p.variedad) return false;
    if (omitir !== 'destino' && p.destino && f.destino !== p.destino) return false;
    if (omitir !== 'traza' && p.traza && trazaDe(f).estado !== p.traza) return false;
    if (p.exportador && f.exportador !== p.exportador) return false;
    if (p.importador && f.importador !== p.importador) return false;
    if (q) {
      const texto = [
        f.exportador, f.importador, f.exp, f.planta, f.planta_cod, f.destino, f.origen,
        ...f.campos.map((c) => `${c.clp} ${predios[c.clp] ?? ''}`),
      ].join(' ').toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });
}

function ordenar(filas: FilaMock[], orden: FiltrosEnvios['orden'], dir: FiltrosEnvios['dir']) {
  const s = dir === 'asc' ? 1 : -1;
  const val = (f: FilaMock): number | string => {
    switch (orden) {
      case 'exportador': return f.exportador;
      case 'importador': return f.importador;
      case 'destino': return f.destino;
      case 'peso': return f.peso_kg;
      case 'traza': return trazaDe(f).cobertura;
      default: return f.anio * 100 + f.mes;
    }
  };
  return [...filas].sort((a, b) => {
    const x = val(a), y = val(b);
    return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * s;
  });
}

const contar = (filas: FilaMock[], key: 'variedad' | 'destino'): Conteo[] => {
  const m = new Map<string, number>();
  filas.forEach((f) => f[key] && m.set(f[key], (m.get(f[key]) ?? 0) + 1));
  return [...m.entries()].map(([n, envios]) => ({ n, envios })).sort((a, b) => b.envios - a.envios);
};

const conPredio = (f: FilaMock, predios: Record<string, string>): Envio => ({
  ...f,
  campos: f.campos.map((c) => ({ ...c, predio: predios[c.clp] ?? null })),
});

export async function enviosMock(p: EnviosParams): Promise<EnviosPage> {
  const { filas, predios } = (await cargar())[p.crop];
  await latencia();
  const filtradas = ordenar(filtrar(filas, p, predios), p.orden, p.dir);
  const pagina = filtradas.slice(p.offset, p.offset + p.limit);

  const traza: Record<EstadoTraza, number> = { completa: 0, parcial: 0, sin: 0 };
  filtrar(filas, p, predios, 'traza').forEach((f) => traza[trazaDe(f).estado]++);

  const por_mes = Array(12).fill(0) as number[];
  filtradas.forEach((f) => (por_mes[f.mes - 1] += f.peso_kg / 1000));

  return {
    total: filtradas.length,
    resumen: {
      peso_kg: filtradas.reduce((s, f) => s + f.peso_kg, 0),
      aporte_kg: filtradas.reduce((s, f) => s + (f.aporte_kg ?? 0), 0),
      exportadores: new Set(filtradas.map((f) => f.exportador)).size,
      importadores: new Set(filtradas.map((f) => f.importador).filter(Boolean)).size,
      traza,
      por_mes,
    },
    facetas: {
      variedades: contar(filtrar(filas, p, predios, 'variedad'), 'variedad'),
      destinos: contar(filtrar(filas, p, predios, 'destino'), 'destino'),
    },
    filas: pagina.map((f) => conPredio(f, predios)),
    siguiente: p.offset + p.limit < filtradas.length ? p.offset + p.limit : null,
  };
}

export async function envioMock(crop: CropId, id: string): Promise<Envio | null> {
  const { filas, predios } = (await cargar())[crop];
  await latencia();
  const f = filas.find((x) => x.id === id);
  return f ? conPredio(f, predios) : null;
}

export async function enviosTodosMock(p: Omit<EnviosParams, 'offset' | 'limit'>): Promise<Envio[]> {
  const { filas, predios } = (await cargar())[p.crop];
  return ordenar(filtrar(filas, p, predios), p.orden, p.dir).map((f) => conPredio(f, predios));
}

const top = (m: Map<string, number>, n = 8) =>
  [...m.entries()].map(([k, kg]) => ({ n: k, kg })).sort((a, b) => b.kg - a.kg).slice(0, n);

export async function fichaExportadorMock(crop: CropId, nombre: string, p: Periodo): Promise<FichaExportador | null> {
  const { filas, predios } = (await cargar())[crop];
  await latencia();
  const propias = filas.filter((f) => f.exportador === nombre && enPeriodo(f, p));
  if (!propias.length) return null;

  const mensual = Array(12).fill(0) as number[];
  const dest = new Map<string, number>();
  const imp = new Map<string, number>();
  const campos = new Map<string, number>();
  for (const f of propias) {
    mensual[f.mes - 1] += f.peso_kg;
    dest.set(f.destino, (dest.get(f.destino) ?? 0) + f.peso_kg);
    if (f.importador) imp.set(f.importador, (imp.get(f.importador) ?? 0) + f.peso_kg);
    f.campos.forEach((c) => campos.set(c.clp, (campos.get(c.clp) ?? 0) + (c.kg ?? 0)));
  }
  // Total que produjo cada campo con todos sus exportadores (para saber qué parte se lleva este)
  const totalCampo = new Map<string, number>();
  for (const f of filas) {
    if (!enPeriodo(f, p)) continue;
    f.campos.forEach((c) => campos.has(c.clp) && totalCampo.set(c.clp, (totalCampo.get(c.clp) ?? 0) + (c.kg ?? 0)));
  }

  return {
    nombre,
    envios: propias.length,
    peso_kg: propias.reduce((s, f) => s + f.peso_kg, 0),
    mensual,
    destinos: top(dest),
    importadores: top(imp),
    campos: [...campos.entries()]
      .map(([clp, kg]) => ({ clp, predio: predios[clp] ?? null, kg, kg_total_campo: totalCampo.get(clp) ?? kg }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 8),
  };
}