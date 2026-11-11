/**
 * Implementación en el navegador de:
 *   GET /api/trazabilidad          -> TrazabilidadData
 *   GET /api/trazabilidad/cadena   -> Cadena (tipo + nombre del eslabón elegido)
 *
 * El estado de cada envío usa la misma regla que Envíos (features/envios/traza.ts).
 * Cuando el punto de partida es un campo, cada envío pesa solo la parte de fruta que aportó ese campo.
 */
import type {
    Cadena, CadenaNodo, CropId, Eslabon, EstadoTraza, Periodo, TrazabilidadData, TrazabilidadParams, TrazaExportador,
  } from '@/types/agro';
  import { mesEnRango } from '@/store/filtros';
  import { trazaDe } from '@/features/envios/traza';
  
  interface FilaEnvio {
    anio: number; mes: number; exportador: string; importador: string; destino: string; origen: string; variedad: string;
    planta: string; planta_cod: string; peso_kg: number; aporte_kg: number | null;
    campos: { clp: string; kg: number | null }[];
  }
  type Base = Record<string, { filas: FilaEnvio[]; predios: Record<string, string> }>;
  
  let cache: Base | null = null;
  const cargar = async () => (cache ??= (await import('./envios.json')).default as unknown as Base);
  const latencia = () => new Promise((r) => setTimeout(r, 150));
  const enPeriodo = (f: FilaEnvio, p: Periodo) => (p.anio === null || f.anio === p.anio) && mesEnRango(f.mes, p);
  
  /** kg embarcados que salieron de ese campo (si los campos declaran más de lo embarcado, se reparte a prorrata) */
  function kgDeCampo(f: FilaEnvio, kg: number | null) {
    const aporte = f.aporte_kg ?? f.campos.reduce((s, c) => s + (c.kg ?? 0), 0);
    if (!aporte || !kg) return 0;
    return kg * Math.min(1, f.peso_kg / aporte);
  }
  const respaldadoKg = (f: FilaEnvio) => f.peso_kg - trazaDe(f).sin_enlazar_kg;
  
  const sumar = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const topN = (m: Map<string, number>, n: number) => new Set([...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k));
  
  /* ---------- vista general ---------- */
  
  export async function trazabilidadMock(p: TrazabilidadParams): Promise<TrazabilidadData> {
    const { filas: todas, predios } = (await cargar())[p.crop];
    await latencia();
    const filas = todas.filter((f) => enPeriodo(f, p));
  
    const estados: Record<EstadoTraza, { envios: number; t: number }> = {
      completa: { envios: 0, t: 0 }, parcial: { envios: 0, t: 0 }, sin: { envios: 0, t: 0 },
    };
    const campos = new Set<string>();
    const plantas = new Set<string>();
    let pesoKg = 0;
    let respKg = 0;
  
    const exps = new Map<string, { kg: number; envios: number; est: Record<EstadoTraza, number>; campos: Set<string>; plantas: Set<string> }>();
    const porImportador = new Map<string, number>();
    const porCampo = new Map<string, number>();
  
    for (const f of filas) {
      const tr = trazaDe(f);
      estados[tr.estado].envios++;
      estados[tr.estado].t += f.peso_kg / 1000;
      pesoKg += f.peso_kg;
      respKg += f.peso_kg - tr.sin_enlazar_kg;
      f.campos.forEach((c) => {
        campos.add(c.clp);
        sumar(porCampo, c.clp, kgDeCampo(f, c.kg));
      });
      if (f.planta) plantas.add(f.planta);
      if (f.importador) sumar(porImportador, f.importador, f.peso_kg);
  
      const e = exps.get(f.exportador) ?? { kg: 0, envios: 0, est: { completa: 0, parcial: 0, sin: 0 }, campos: new Set(), plantas: new Set() };
      e.kg += f.peso_kg;
      e.envios++;
      e.est[tr.estado] += f.peso_kg;
      f.campos.forEach((c) => e.campos.add(c.clp));
      if (f.planta) e.plantas.add(f.planta);
      exps.set(f.exportador, e);
    }
  
    // Año a año (todos los años, mismo rango de meses)
    const anios = new Map<number, Record<EstadoTraza, number>>();
    todas.filter((f) => mesEnRango(f.mes, p)).forEach((f) => {
      const a = anios.get(f.anio) ?? { completa: 0, parcial: 0, sin: 0 };
      a[trazaDe(f).estado] += f.peso_kg;
      anios.set(f.anio, a);
    });
  
    // Flujo región -> variedad -> destino con el peso respaldado por campo
    const reg = new Map<string, number>();
    const vari = new Map<string, number>();
    const des = new Map<string, number>();
    filas.forEach((f) => {
      const kg = respaldadoKg(f);
      if (kg <= 0) return;
      sumar(reg, f.origen || 'SIN REGION', kg);
      sumar(vari, f.variedad || 'SIN VARIEDAD', kg);
      sumar(des, f.destino, kg);
    });
    const [tReg, tVar, tDes] = [topN(reg, 6), topN(vari, 6), topN(des, 7)];
    const nReg = (n: string) => (tReg.has(n) ? `r:${n}` : 'r:otros');
    const nVar = (n: string) => (tVar.has(n) ? `v:${n}` : 'v:otros');
    const nDes = (n: string) => (tDes.has(n) ? `d:${n}` : 'd:otros');
    const enl = new Map<string, number>();
    filas.forEach((f) => {
      const kg = respaldadoKg(f);
      if (kg <= 0) return;
      sumar(enl, `${nReg(f.origen || 'SIN REGION')}|${nVar(f.variedad || 'SIN VARIEDAD')}`, kg);
      sumar(enl, `${nVar(f.variedad || 'SIN VARIEDAD')}|${nDes(f.destino)}`, kg);
    });
    const ids = new Set([...enl.keys()].flatMap((k) => k.split('|')));
    const OTROS = { r: 'Otras regiones', v: 'Otras variedades', d: 'Otros destinos' } as const;
    const nodos = [...ids].map((id) => {
      const [pre, ...resto] = id.split(':');
      const n = resto.join(':');
      return { id, n: n === 'otros' ? OTROS[pre as 'r' | 'v' | 'd'] : n, col: (pre === 'r' ? 0 : pre === 'v' ? 1 : 2) as 0 | 1 | 2 };
    });
  
    const exportadores: TrazaExportador[] = [...exps.entries()]
      .map(([n, e]) => ({
        n,
        t: e.kg / 1000,
        envios: e.envios,
        completa: (e.est.completa / e.kg) * 100,
        parcial: (e.est.parcial / e.kg) * 100,
        sin: (e.est.sin / e.kg) * 100,
        campos: e.campos.size,
        plantas: e.plantas.size,
      }))
      .sort((a, b) => b.t - a.t);
  
    const primero = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const sugeridos: TrazabilidadData['sugeridos'] = [];
    const imp = primero(porImportador);
    if (imp) sugeridos.push({ tipo: 'importador', n: imp, detalle: null });
    if (exportadores[0]) sugeridos.push({ tipo: 'exportador', n: exportadores[0].n, detalle: null });
    const campo = primero(porCampo);
    if (campo) sugeridos.push({ tipo: 'campo', n: campo, detalle: predios[campo] ?? null });
  
    return {
      resumen: { envios: filas.length, peso_t: pesoKg / 1000, respaldado_t: respKg / 1000, estados, campos: campos.size, plantas: plantas.size },
      por_anio: [...anios.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([anio, e]) => {
          const tot = e.completa + e.parcial + e.sin || 1;
          return { anio, t: tot / 1000, completa: (e.completa / tot) * 100, parcial: (e.parcial / tot) * 100, sin: (e.sin / tot) * 100 };
        }),
      flujo: { nodos, enlaces: [...enl.entries()].map(([k, kg]) => { const [a, b] = k.split('|'); return { a, b, t: kg / 1000 }; }) },
      exportadores,
      sugeridos,
    };
  }
  
  /* ---------- rastreador: todo lo conectado a un eslabón ---------- */
  
  const coincide: Record<Eslabon, (f: FilaEnvio, n: string) => boolean> = {
    campo: (f, n) => f.campos.some((c) => c.clp === n),
    planta: (f, n) => f.planta === n,
    exportador: (f, n) => f.exportador === n,
    importador: (f, n) => f.importador === n,
    destino: (f, n) => f.destino === n,
  };
  
  export async function cadenaMock(crop: CropId, p: Periodo, tipo: Eslabon, n: string): Promise<Cadena | null> {
    const { filas: todas, predios } = (await cargar())[crop];
    await latencia();
    const filas = todas.filter((f) => enPeriodo(f, p) && coincide[tipo](f, n));
    if (!filas.length) return null;
  
    const cols: Record<Eslabon, Map<string, { detalle: string | null; kg: number; envios: number; sin_campo?: boolean }>> = {
      campo: new Map(), planta: new Map(), exportador: new Map(), importador: new Map(), destino: new Map(),
    };
    const add = (col: Eslabon, nombre: string, detalle: string | null, kg: number, extra?: { sin_campo: boolean }) => {
      if (!nombre || kg <= 0) return;
      const r = cols[col].get(nombre) ?? { detalle, kg: 0, envios: 0, ...extra };
      r.kg += kg;
      r.envios++;
      cols[col].set(nombre, r);
    };
    const detalleCampo = (clp: string, f: FilaEnvio) => [predios[clp], f.origen].filter(Boolean).join(' · ') || null;
  
    let totalKg = 0;
    let respKg = 0;
    for (const f of filas) {
      let kg = f.peso_kg;
      if (tipo === 'campo') {
        const propio = f.campos.find((c) => c.clp === n);
        kg = kgDeCampo(f, propio?.kg ?? null);
        add('campo', n, detalleCampo(n, f), kg);
        respKg += kg;
      } else {
        f.campos.forEach((c) => add('campo', c.clp, detalleCampo(c.clp, f), kgDeCampo(f, c.kg)));
        const sin = trazaDe(f).sin_enlazar_kg;
        add('campo', 'Sin campo enlazado', 'Peso que ningún campo respalda', sin, { sin_campo: true });
        respKg += f.peso_kg - sin;
      }
      totalKg += kg;
      add('planta', f.planta, f.planta_cod || null, kg);
      add('exportador', f.exportador, null, kg);
      add('importador', f.importador, null, kg);
      add('destino', f.destino, null, kg);
    }
  
    const lista = (m: (typeof cols)[Eslabon]): CadenaNodo[] =>
      [...m.entries()]
        .map(([nombre, r]) => ({ n: nombre, detalle: r.detalle, t: r.kg / 1000, envios: r.envios, ...(r.sin_campo ? { sin_campo: true } : {}) }))
        .sort((a, b) => Number(!!a.sin_campo) - Number(!!b.sin_campo) || b.t - a.t);
  
    const columnas = {
      campo: lista(cols.campo), planta: lista(cols.planta), exportador: lista(cols.exportador),
      importador: lista(cols.importador), destino: lista(cols.destino),
    };
    return {
      foco: { tipo, n, detalle: tipo === 'campo' ? columnas.campo[0]?.detalle ?? null : tipo === 'planta' ? columnas.planta[0]?.detalle ?? null : null },
      t: totalKg / 1000,
      envios: filas.length,
      cobertura: totalKg ? Math.min(100, (respKg / totalKg) * 100) : 0,
      columnas,
    };
  }