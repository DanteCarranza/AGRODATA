/**
 * Implementación en el navegador de:
 *   GET /api/importadores            -> ImportadoresPage (paginado)
 *   GET /api/importadores/ficha      -> FichaImportador
 *   GET /api/importadores/exportar   -> CSV
 *
 * La tendencia compara la PARTICIPACIÓN de cada importador en las toneladas del cultivo
 * (periodo actual frente al anterior), no toneladas absolutas: así no depende de cuántos
 * envíos tenga la muestra en cada año.
 */
import type {
    Conteo, CropId, FichaImportador, ImportadorFila, ImportadoresPage, ImportadoresParams, Periodo, Tendencia,
  } from '@/types/agro';
  import { mesEnRango } from '@/store/filtros';
  import { MESES } from '@/config/crops';
  import { filasCampos } from './campos.mock';
  
  interface FilaEnvio {
    anio: number; mes: number; exportador: string; importador: string; destino: string; variedad: string; peso_kg: number;
    campos: { clp: string }[];
  }
  
  let cache: Record<string, { filas: FilaEnvio[] }> | null = null;
  const cargar = async () => (cache ??= (await import('./envios.json')).default as unknown as Record<string, { filas: FilaEnvio[] }>);
  const latencia = () => new Promise((r) => setTimeout(r, 150));
  const enPeriodo = (f: FilaEnvio, p: Periodo) => (p.anio === null || f.anio === p.anio) && mesEnRango(f.mes, p);
  
  const MIN_ENVIOS = 25; // envíos mínimos del cultivo en cada periodo para que la comparación sea confiable
  const MIN_IMPORTADOR = 3; // envíos mínimos de un importador en un periodo para opinar sobre su tendencia
  
  /* ---------- periodo actual vs anterior (misma regla que el dashboard) ---------- */
  
  const idx = (f: { anio: number; mes: number }) => f.anio * 12 + f.mes - 1;
  const etiquetaMes = (i: number) => `${MESES[i % 12].toLowerCase()} ${Math.floor(i / 12)}`;
  
  function ventanas(filas: FilaEnvio[], p: Periodo) {
    if (p.anio !== null) {
      return {
        actual: (f: FilaEnvio) => f.anio === p.anio && mesEnRango(f.mes, p),
        anterior: (f: FilaEnvio) => f.anio === p.anio! - 1 && mesEnRango(f.mes, p),
        etiquetas: [`${p.anio}`, `${p.anio - 1}`],
      };
    }
    const ultimo = filas.reduce((mx, f) => Math.max(mx, idx(f)), 0);
    return {
      actual: (f: FilaEnvio) => idx(f) > ultimo - 12 && mesEnRango(f.mes, p),
      anterior: (f: FilaEnvio) => idx(f) <= ultimo - 12 && idx(f) > ultimo - 24 && mesEnRango(f.mes, p),
      etiquetas: [`${etiquetaMes(ultimo - 11)} – ${etiquetaMes(ultimo)}`, `${etiquetaMes(ultimo - 23)} – ${etiquetaMes(ultimo - 12)}`],
    };
  }
  
  /** % de toneladas y n.° de envíos por importador */
  function participacion(filas: FilaEnvio[]) {
    const total = filas.reduce((s, f) => s + f.peso_kg, 0) || 1;
    const m = new Map<string, { kg: number; envios: number }>();
    filas.forEach((f) => {
      if (!f.importador) return;
      const r = m.get(f.importador) ?? { kg: 0, envios: 0 };
      r.kg += f.peso_kg;
      r.envios++;
      m.set(f.importador, r);
    });
    return new Map([...m.entries()].map(([k, r]) => [k, { share: (r.kg / total) * 100, envios: r.envios }]));
  }
  
  type Part = { share: number; envios: number } | undefined;
  
  /**
   * Solo opina cuando hay base suficiente: con pocos envíos, aparecer o desaparecer de la muestra
   * no significa que el importador sea nuevo o haya dejado de comprar.
   */
  function tendenciaDe(ahora: Part, antes: Part, primeraCompraEnActual: boolean): Tendencia | null {
    const na = ahora?.envios ?? 0;
    const nb = antes?.envios ?? 0;
    if (na >= MIN_IMPORTADOR && nb >= MIN_IMPORTADOR) {
      const r = ahora!.share / antes!.share;
      return r >= 1.25 ? 'crece' : r <= 0.75 ? 'cae' : 'estable';
    }
    if (na >= MIN_IMPORTADOR && nb === 0 && primeraCompraEnActual) return 'nuevo';
    if (nb >= MIN_IMPORTADOR && na === 0) return 'inactivo';
    return null;
  }
  
  async function comparar(crop: CropId, p: Periodo) {
    const { filas } = (await cargar())[crop];
    const w = ventanas(filas, p);
    const a = filas.filter(w.actual);
    const b = filas.filter(w.anterior);
    if (a.length < MIN_ENVIOS || b.length < MIN_ENVIOS) return null;
    // primera compra de cada importador en toda la base
    const primera = new Map<string, number>();
    filas.forEach((f) => f.importador && primera.set(f.importador, Math.min(primera.get(f.importador) ?? Infinity, idx(f))));
    const inicioActual = Math.min(...a.map(idx));
    return {
      ahora: participacion(a),
      antes: participacion(b),
      esNuevo: (n: string) => (primera.get(n) ?? -Infinity) >= inicioActual,
      etiquetas: w.etiquetas,
    };
  }
  
  /* ---------- agregados por importador ---------- */
  
  const masFrecuente = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
  
  async function base(crop: CropId, p: Periodo) {
    const { filas } = (await cargar())[crop];
    const enP = filas.filter((f) => f.importador && enPeriodo(f, p));
    const total = enP.reduce((s, f) => s + f.peso_kg, 0) || 1;
    const cmp = await comparar(crop, p);
  
    const m = new Map<string, { kg: number; envios: number; dest: Map<string, number>; vars: Map<string, number>; meses: number[]; exps: Set<string> }>();
    for (const f of enP) {
      const r = m.get(f.importador) ?? { kg: 0, envios: 0, dest: new Map(), vars: new Map(), meses: Array(12).fill(0), exps: new Set<string>() };
      r.kg += f.peso_kg;
      r.envios++;
      r.dest.set(f.destino, (r.dest.get(f.destino) ?? 0) + 1);
      if (f.variedad) r.vars.set(f.variedad, (r.vars.get(f.variedad) ?? 0) + f.peso_kg);
      r.meses[f.mes - 1] += f.peso_kg / 1000;
      r.exps.add(f.exportador);
      m.set(f.importador, r);
    }
  
    const filasImp: ImportadorFila[] = [...m.entries()].map(([n, r]) => {
      const variedad = masFrecuente(r.vars);
      const ahora = cmp?.ahora.get(n);
      const antes = cmp?.antes.get(n);
      const tendencia = cmp ? tendenciaDe(ahora, antes, cmp.esNuevo(n)) : null;
      return {
        n,
        pais: masFrecuente(r.dest) ?? '',
        t: r.kg / 1000,
        envios: r.envios,
        share: (r.kg / total) * 100,
        variedad,
        variedad_share: variedad ? ((r.vars.get(variedad) ?? 0) / r.kg) * 100 : 0,
        meses: r.meses,
        proveedores: r.exps.size,
        tendencia,
        delta_pp: tendencia ? (ahora?.share ?? 0) - (antes?.share ?? 0) : null,
      };
    });
    return { filas: filasImp, cmp };
  }
  
  type Omitible = 'pais' | 'variedad' | 'tendencia';
  
  function filtrar(filas: ImportadorFila[], p: ImportadoresParams, omitir?: Omitible) {
    const q = p.q.trim().toLowerCase();
    return filas.filter((f) => {
      if (omitir !== 'pais' && p.pais && f.pais !== p.pais) return false;
      if (omitir !== 'variedad' && p.variedad && f.variedad !== p.variedad) return false;
      if (omitir !== 'tendencia' && p.tendencia && f.tendencia !== p.tendencia) return false;
      if (q && !f.n.toLowerCase().includes(q)) return false;
      return true;
    });
  }
  
  function ordenar(filas: ImportadorFila[], p: ImportadoresParams) {
    const s = p.dir === 'asc' ? 1 : -1;
    const val = (f: ImportadorFila): number | string => {
      switch (p.orden) {
        case 'nombre': return f.n;
        case 'envios': return f.envios;
        case 'proveedores': return f.proveedores;
        case 'tendencia': return f.delta_pp ?? -Infinity;
        default: return f.t;
      }
    };
    return [...filas].sort((a, b) => {
      const x = val(a), y = val(b);
      return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * s;
    });
  }
  
  const contar = (filas: ImportadorFila[], key: 'pais' | 'variedad'): Conteo[] => {
    const m = new Map<string, number>();
    filas.forEach((f) => f[key] && m.set(f[key]!, (m.get(f[key]!) ?? 0) + 1));
    return [...m.entries()].map(([n, envios]) => ({ n, envios })).sort((a, b) => b.envios - a.envios);
  };
  
  export async function importadoresMock(p: ImportadoresParams): Promise<ImportadoresPage> {
    const { filas, cmp } = await base(p.crop, p);
    await latencia();
    const filtradas = ordenar(filtrar(filas, p), p);
  
    const paises = new Map<string, { importadores: number; t: number }>();
    filtrar(filas, p, 'pais').forEach((f) => {
      const r = paises.get(f.pais) ?? { importadores: 0, t: 0 };
      r.importadores++;
      r.t += f.t;
      paises.set(f.pais, r);
    });
    const tendencias: Record<Tendencia, number> = { crece: 0, estable: 0, cae: 0, nuevo: 0, inactivo: 0 };
    let sinClasificar = 0;
    filtrar(filas, p, 'tendencia').forEach((f) => (f.tendencia ? tendencias[f.tendencia]++ : sinClasificar++));
  
    const porT = [...filtradas].sort((a, b) => b.t - a.t);
    const totalT = porT.reduce((s, f) => s + f.t, 0) || 1;
  
    return {
      total: filtradas.length,
      comparativo: cmp ? { actual: cmp.etiquetas[0], anterior: cmp.etiquetas[1] } : null,
      resumen: {
        t: filtradas.reduce((s, f) => s + f.t, 0),
        paises: [...paises.entries()].map(([n, r]) => ({ n, ...r })).sort((a, b) => b.t - a.t),
        tendencias,
        sin_clasificar: sinClasificar,
        top: porT.slice(0, 3),
        top10: porT.slice(0, 10).map((f) => (f.t / totalT) * 100),
      },
      facetas: { paises: contar(filtrar(filas, p, 'pais'), 'pais'), variedades: contar(filtrar(filas, p, 'variedad'), 'variedad') },
      filas: filtradas.slice(p.offset, p.offset + p.limit),
      siguiente: p.offset + p.limit < filtradas.length ? p.offset + p.limit : null,
    };
  }
  
  export async function importadoresTodosMock(p: Omit<ImportadoresParams, 'offset' | 'limit'>) {
    const q = { ...p, offset: 0, limit: Infinity };
    const { filas } = await base(p.crop, p);
    return ordenar(filtrar(filas, q), q);
  }
  
  export async function fichaImportadorMock(crop: CropId, nombre: string, p: Periodo): Promise<FichaImportador | null> {
    const { filas } = (await cargar())[crop];
    const { filas: imps } = await base(crop, p);
    await latencia();
    const fila = imps.find((f) => f.n === nombre);
    if (!fila) return null;
  
    const propias = filas.filter((f) => f.importador === nombre && enPeriodo(f, p));
    const totalKg = propias.reduce((s, f) => s + f.peso_kg, 0) || 1;
    const suma = (key: 'variedad' | 'exportador') => {
      const m = new Map<string, { kg: number; envios: number }>();
      propias.forEach((f) => {
        if (!f[key]) return;
        const r = m.get(f[key]) ?? { kg: 0, envios: 0 };
        r.kg += f.peso_kg;
        r.envios++;
        m.set(f[key], r);
      });
      return [...m.entries()].map(([n, r]) => ({ n, share: (r.kg / totalKg) * 100, envios: r.envios })).sort((a, b) => b.share - a.share);
    };
  
    // Participación por año en las compras del cultivo (respeta el rango de meses)
    const porAnio = new Map<number, { total: number; propio: number }>();
    filas.forEach((f) => {
      if (!mesEnRango(f.mes, p)) return;
      const r = porAnio.get(f.anio) ?? { total: 0, propio: 0 };
      r.total += f.peso_kg;
      if (f.importador === nombre) r.propio += f.peso_kg;
      porAnio.set(f.anio, r);
    });
  
    // Campos con su variedad preferida que hoy no le venden
    const yaLeVenden = new Set(filas.filter((f) => f.importador === nombre).flatMap((f) => f.campos.map((c) => c.clp)));
    const campos = fila.variedad
      ? (await filasCampos(crop, p))
          .filter((c) => c.variedad === fila.variedad && !yaLeVenden.has(c.clp))
          .sort((a, b) => b.t - a.t)
          .slice(0, 8)
          .map((c) => ({ clp: c.clp, predio: c.predio, region: c.region, t: c.t, exportador_principal: c.exportador_principal, uso_pct: c.uso_pct }))
      : [];
  
    return {
      nombre,
      pais: fila.pais,
      t: fila.t,
      envios: fila.envios,
      share: fila.share,
      meses: fila.meses,
      por_anio: [...porAnio.entries()].sort((a, b) => a[0] - b[0]).map(([anio, r]) => ({ anio, share: r.total ? (r.propio / r.total) * 100 : 0 })),
      variedades: suma('variedad').map(({ n, share }) => ({ n, share })),
      proveedores: suma('exportador'),
      campos_sugeridos: campos,
      tendencia: fila.tendencia,
      delta_pp: fila.delta_pp,
      contacto: null, // los contactos del prototipo son de relleno: no se muestran como reales
    };
  }