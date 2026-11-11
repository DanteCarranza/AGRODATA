/**
 * Implementación en el navegador de:
 *   GET /api/campos          -> CamposPage (paginado)
 *   GET /api/campos/:clp     -> FichaCampo
 *   GET /api/campos/exportar -> CSV
 * Envíos y toneladas salen de la misma muestra de envíos que usa el resto de la app;
 * los datos fijos (ubicación, certificación, compradores) salen de campos.json.
 */
import type {
    CampoFila, CamposPage, CamposParams, Compradores, Conteo, CropId, FichaCampo, Periodo,
  } from '@/types/agro';
  import { mesEnRango } from '@/store/filtros';
  
  interface Estatico {
    predio: string | null;
    productor: string | null;
    region: string | null;
    provincia: string | null;
    distrito: string | null;
    sector: string | null;
    direccion: string | null;
    gps: { lat: number; lng: number } | null;
    cert: FichaCampo['certificacion'];
    compradores: { n: string; share: number }[];
  }
  interface FilaEnvio {
    anio: number; mes: number; exportador: string; destino: string; variedad: string; origen: string; peso_kg: number;
    campos: { clp: string; kg: number | null }[];
  }
  
  let cache: { campos: Record<string, Record<string, Estatico>>; envios: Record<string, { filas: FilaEnvio[] }> } | null = null;
  async function cargar() {
    if (!cache) {
      const [c, e] = await Promise.all([import('./campos.json'), import('./envios.json')]);
      cache = {
        campos: c.default as unknown as Record<string, Record<string, Estatico>>,
        envios: e.default as unknown as Record<string, { filas: FilaEnvio[] }>,
      };
    }
    return cache;
  }
  const latencia = () => new Promise((r) => setTimeout(r, 150));
  const enPeriodo = (f: FilaEnvio, p: Periodo) => (p.anio === null || f.anio === p.anio) && mesEnRango(f.mes, p);
  
  const masFrecuente = (valores: string[]) => {
    const m = new Map<string, number>();
    valores.filter(Boolean).forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  
  export const grupoCompradores = (n: number): Compradores => (n <= 1 ? 'uno' : n <= 3 ? 'pocos' : 'muchos');
  
  interface Agregado {
    envios: number;
    kg: number;
    exportadores: Map<string, number>;
    variedades: string[];
    origenes: string[];
  }
  
  /** Recorre los envíos del periodo una sola vez y acumula por campo */
  function agregar(filas: FilaEnvio[], p: Periodo) {
    const m = new Map<string, Agregado>();
    for (const f of filas) {
      if (!enPeriodo(f, p)) continue;
      for (const c of f.campos) {
        const a: Agregado = m.get(c.clp) ?? { envios: 0, kg: 0, exportadores: new Map(), variedades: [], origenes: [] };
        a.envios++;
        a.kg += c.kg ?? 0;
        a.exportadores.set(f.exportador, (a.exportadores.get(f.exportador) ?? 0) + (c.kg ?? 0));
        a.variedades.push(f.variedad);
        a.origenes.push(f.origen);
        m.set(c.clp, a);
      }
    }
    return m;
  }
  
  function fila(clp: string, est: Estatico | undefined, a: Agregado): CampoFila {
    const compradores = est?.compradores.length ? est.compradores : [...a.exportadores.entries()].map(([n, kg]) => ({ n, share: kg }));
    const principal = [...compradores].sort((x, y) => y.share - x.share)[0]?.n ?? null;
    const cap = est?.cert?.capacidad_t;
    const exp = est?.cert?.exportado_campana_t;
    return {
      clp,
      predio: est?.predio ?? null,
      productor: est?.productor ?? null,
      region: est?.region ?? masFrecuente(a.origenes),
      variedad: est?.cert?.variedades[0]?.v ?? masFrecuente(a.variedades),
      exportador_principal: principal,
      exportadores: compradores.length,
      envios: a.envios,
      t: a.kg / 1000,
      uso_pct: cap && exp !== null && exp !== undefined ? (exp / cap) * 100 : null,
      gps: !!est?.gps,
    };
  }
  
  type Omitible = 'region' | 'variedad' | 'compradores';
  
  function filtrar(filas: CampoFila[], p: CamposParams, omitir?: Omitible) {
    const q = p.q.trim().toLowerCase();
    return filas.filter((f) => {
      if (omitir !== 'region' && p.region && f.region !== p.region) return false;
      if (omitir !== 'variedad' && p.variedad && f.variedad !== p.variedad) return false;
      if (omitir !== 'compradores' && p.compradores && grupoCompradores(f.exportadores) !== p.compradores) return false;
      if (q) {
        const texto = [f.clp, f.predio, f.productor, f.region, f.variedad, f.exportador_principal].join(' ').toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }
  
  const contar = (filas: CampoFila[], key: 'region' | 'variedad'): Conteo[] => {
    const m = new Map<string, number>();
    filas.forEach((f) => f[key] && m.set(f[key]!, (m.get(f[key]!) ?? 0) + 1));
    return [...m.entries()].map(([n, envios]) => ({ n, envios })).sort((a, b) => b.envios - a.envios);
  };
  
/** Todos los campos con envíos en el periodo (lo usan también los campos sugeridos del importador) */
export async function filasCampos(crop: CropId, p: Periodo) {
    const db = await cargar();
    const est = db.campos[crop];
    const ag = agregar(db.envios[crop].filas, p);
    return [...ag.entries()].map(([clp, a]) => fila(clp, est[clp], a));
  }
  
  const todas = (p: CamposParams) => filasCampos(p.crop, p);
  
  function ordenar(filas: CampoFila[], p: CamposParams) {
    const s = p.dir === 'asc' ? 1 : -1;
    const val = (f: CampoFila): number | string => {
      switch (p.orden) {
        case 'clp': return f.clp;
        case 'envios': return f.envios;
        case 'exportadores': return f.exportadores;
        case 'uso': return f.uso_pct ?? -1;
        default: return f.t;
      }
    };
    return [...filas].sort((a, b) => {
      const x = val(a), y = val(b);
      return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * s;
    });
  }
  
  export async function camposMock(p: CamposParams): Promise<CamposPage> {
    const base = await todas(p);
    await latencia();
    const filtradas = ordenar(filtrar(base, p), p);
  
    const regiones = new Map<string, { campos: number; t: number }>();
    filtrar(base, p, 'region').forEach((f) => {
      const k = f.region ?? 'Sin región';
      const r = regiones.get(k) ?? { campos: 0, t: 0 };
      r.campos++;
      r.t += f.t;
      regiones.set(k, r);
    });
    const compradores: Record<Compradores, number> = { uno: 0, pocos: 0, muchos: 0 };
    filtrar(base, p, 'compradores').forEach((f) => compradores[grupoCompradores(f.exportadores)]++);
  
    return {
      total: filtradas.length,
      resumen: {
        t: filtradas.reduce((s, f) => s + f.t, 0),
        exportadores: new Set(filtradas.map((f) => f.exportador_principal).filter(Boolean)).size,
        regiones: [...regiones.entries()].map(([n, r]) => ({ n, ...r })).sort((a, b) => b.t - a.t),
        compradores,
      },
      facetas: { regiones: contar(filtrar(base, p, 'region'), 'region'), variedades: contar(filtrar(base, p, 'variedad'), 'variedad') },
      filas: filtradas.slice(p.offset, p.offset + p.limit),
      siguiente: p.offset + p.limit < filtradas.length ? p.offset + p.limit : null,
    };
  }
  
  export async function camposTodosMock(p: Omit<CamposParams, 'offset' | 'limit'>) {
    const q = { ...p, offset: 0, limit: Infinity };
    return ordenar(filtrar(await todas(q), q), q);
  }
  
  export async function fichaCampoMock(crop: CropId, clp: string, p: Periodo): Promise<FichaCampo | null> {
    const db = await cargar();
    await latencia();
    const est = db.campos[crop][clp];
    const propias = db.envios[crop].filas.filter((f) => f.campos.some((c) => c.clp === clp));
    if (!est && !propias.length) return null;
  
    const enP = propias.filter((f) => enPeriodo(f, p));
    const kgDe = (f: FilaEnvio) => f.campos.find((c) => c.clp === clp)?.kg ?? 0;
    const mensual = Array(12).fill(0) as number[];
    const dest = new Map<string, number>();
    const exps = new Map<string, number>();
    enP.forEach((f) => {
      mensual[f.mes - 1] += kgDe(f);
      dest.set(f.destino, (dest.get(f.destino) ?? 0) + kgDe(f));
      exps.set(f.exportador, (exps.get(f.exportador) ?? 0) + kgDe(f));
    });
    const totalExp = [...exps.values()].reduce((s, n) => s + n, 0) || 1;
    const ultimo = propias.reduce<{ anio: number; mes: number } | null>(
      (u, f) => (!u || f.anio * 12 + f.mes > u.anio * 12 + u.mes ? { anio: f.anio, mes: f.mes } : u),
      null,
    );
    const regionEnvios = masFrecuente(propias.map((f) => f.origen));
  
    return {
      clp,
      predio: est?.predio ?? null,
      productor: est?.productor ?? null,
      ubicacion: {
        region: est?.region ?? regionEnvios,
        provincia: est?.provincia ?? null,
        distrito: est?.distrito ?? null,
        sector: est?.sector ?? null,
        direccion: est?.direccion ?? null,
        fuente: est?.region ? 'certificado' : regionEnvios ? 'envios' : null,
      },
      gps: est?.gps ?? null,
      certificacion: est?.cert ?? null,
      compradores: est?.compradores.length
        ? est.compradores
        : [...exps.entries()].map(([n, kg]) => ({ n, share: (kg / totalExp) * 100 })).sort((a, b) => b.share - a.share),
      envios: enP.length,
      t: enP.reduce((s, f) => s + kgDe(f), 0) / 1000,
      mensual,
      destinos: [...dest.entries()].map(([n, kg]) => ({ n, kg })).sort((a, b) => b.kg - a.kg).slice(0, 8),
      ultimo,
    };
  }