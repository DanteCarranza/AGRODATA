/**
 * Implementación en el navegador de:
 *   GET /api/informe?crop&anio&mesIni&mesFin&variedad   -> InformeData
 *
 * Resumen ejecutivo de un cultivo o de una variedad en el periodo elegido.
 * "Gana terreno" usa la misma comparación por participación que Inteligencia.
 */
import type { CropId, InformeData, InformeParams, Periodo } from '@/types/agro';
import { mesEnRango } from '@/store/filtros';
import { filasCampos } from './campos.mock';
import { variedadesMock } from './inteligencia.mock';

interface FilaEnvio {
  anio: number; mes: number; exportador: string; importador: string; destino: string; variedad: string; peso_kg: number;
}

let cache: Record<string, { filas: FilaEnvio[] }> | null = null;
const cargar = async () => (cache ??= (await import('./envios.json')).default as unknown as Record<string, { filas: FilaEnvio[] }>);
const enPeriodo = (f: FilaEnvio, p: Periodo) => (p.anio === null || f.anio === p.anio) && mesEnRango(f.mes, p);
const sumar = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
const top = (m: Map<string, number>, n: number) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, kg]) => ({ n: k, t: kg / 1000 }));

export async function informeMock(p: InformeParams): Promise<InformeData> {
  const { filas: todas } = (await cargar())[p.crop as CropId];
  const delPeriodo = todas.filter((f) => enPeriodo(f, p));
  const filas = p.variedad ? delPeriodo.filter((f) => f.variedad === p.variedad) : delPeriodo;

  const vars = new Map<string, number>();
  const dest = new Map<string, number>();
  const imps = new Map<string, number>();
  const impPais = new Map<string, Map<string, number>>();
  const exps = new Map<string, number>();
  const meses = Array(12).fill(0);
  let kg = 0;
  for (const f of filas) {
    kg += f.peso_kg;
    meses[f.mes - 1] += f.peso_kg / 1000;
    if (f.variedad) sumar(vars, f.variedad, f.peso_kg);
    sumar(dest, f.destino, f.peso_kg);
    sumar(exps, f.exportador, f.peso_kg);
    if (f.importador) {
      sumar(imps, f.importador, f.peso_kg);
      const pm = impPais.get(f.importador) ?? new Map<string, number>();
      sumar(pm, f.destino, 1);
      impPais.set(f.importador, pm);
    }
  }

  const todasVars = new Map<string, number>();
  delPeriodo.forEach((f) => f.variedad && sumar(todasVars, f.variedad, f.peso_kg));

  let gana: InformeData['gana_terreno'] = null;
  if (!p.variedad) {
    const intel = await variedadesMock({ crop: p.crop, anio: p.anio });
    const mejor = intel.variedades
      .slice(0, 8)
      .filter((v) => v.delta_pp !== null && v.delta_pp > 0.3)
      .sort((a, b) => b.delta_pp! - a.delta_pp!)[0];
    if (mejor && intel.comparativo) {
      gana = { n: mejor.n, delta_pp: mejor.delta_pp!, comparativo: `${intel.comparativo.actual} frente a ${intel.comparativo.anterior}` };
    }
  }

  const campos = p.variedad
    ? (await filasCampos(p.crop, p))
        .filter((c) => c.variedad === p.variedad)
        .sort((a, b) => b.t - a.t)
        .slice(0, 6)
        .map((c) => ({ clp: c.clp, predio: c.predio, region: c.region, t: c.t }))
    : [];

  return {
    variedad: p.variedad,
    variedades_disponibles: [...todasVars.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n),
    t: kg / 1000,
    envios: filas.length,
    exportadores: exps.size,
    importadores: imps.size,
    destinos_n: dest.size,
    variedades_n: vars.size,
    meses,
    variedades: top(vars, 5),
    destinos: top(dest, 5),
    importadores_top: top(imps, 5).map((x) => ({
      ...x,
      pais: [...(impPais.get(x.n)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
    })),
    exportadores_top: p.variedad ? top(exps, 6) : [],
    campos,
    gana_terreno: gana,
  };
}