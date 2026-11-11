/**
 * Implementación en el navegador de GET /api/dashboard usando la data del prototipo.
 * El backend NestJS debe devolver exactamente esta misma forma (DashboardData),
 * calculada con SQL sobre PostgreSQL.
 *
 * Las comparaciones entre periodos usan PARTICIPACIÓN (% de las toneladas) y no volumen
 * absoluto: así no dependen de cuántos envíos tenga la muestra en cada año.
 */
import type {
    CeldaCalendario, Comparativo, Conteo, DashboardData, DashboardParams, Hallazgo, Periodo, Ranking,
  } from '@/types/agro';
  import { mesEnRango } from '@/store/filtros';
  import { MESES } from '@/config/crops';
  
  interface EnvioMock { a: number; m: number; t: number; d: string; x: string; i: string; v: string; k: string[] }
  interface CropMock {
    kpis: { envios: number; campos: number; peso_t: number; match: number; traza_pct: number };
    anios: number[];
    dest: { n: string; e: number }[];
    vars: { n: string; e: number }[];
    envios: EnvioMock[];
  }
  
  let cache: Record<string, CropMock> | null = null;
  const cargar = async () => (cache ??= (await import('./agro.json')).default as unknown as Record<string, CropMock>);
  
  type Clave = 'd' | 'x' | 'i' | 'v';
  
  /** % de toneladas por entidad */
  function participacion(envios: EnvioMock[], key: Clave) {
    const total = envios.reduce((s, e) => s + e.t, 0) || 1;
    const m = new Map<string, number>();
    envios.forEach((e) => e[key] && m.set(e[key], (m.get(e[key]) ?? 0) + e.t));
    return new Map([...m.entries()].map(([k, t]) => [k, (t / total) * 100]));
  }
  
  const top = (
    envios: EnvioMock[], key: 'x' | 'i', ahora: Map<string, number> | null, antes: Map<string, number> | null, n = 10,
  ): Ranking[] => {
    const total = envios.reduce((s, e) => s + e.t, 0) || 1;
    const m = new Map<string, { envios: number; t: number; d: Set<string> }>();
    for (const e of envios) {
      const k = e[key];
      if (!k) continue;
      const r = m.get(k) ?? { envios: 0, t: 0, d: new Set<string>() };
      r.envios++;
      r.t += e.t;
      r.d.add(e.d);
      m.set(k, r);
    }
    return [...m.entries()]
      .map(([nombre, r]) => {
        const share = (r.t / total) * 100;
        return {
          n: nombre, envios: r.envios, t: r.t, destinos: r.d.size, share,
          // Δ = participación en el periodo actual del comparativo menos la del anterior
          delta_pp: ahora && antes ? (ahora.get(nombre) ?? 0) - (antes.get(nombre) ?? 0) : null,
        };
      })
      .sort((a, b) => b.t - a.t)
      .slice(0, n);
  };
  
  const contar = (envios: EnvioMock[], key: 'd' | 'v'): Conteo[] => {
    const m = new Map<string, Conteo>();
    for (const e of envios) {
      const k = e[key];
      if (!k) continue;
      const r = m.get(k) ?? { n: k, envios: 0, t: 0 };
      r.envios++;
      r.t! += e.t;
      m.set(k, r);
    }
    return [...m.values()].sort((a, b) => b.envios - a.envios);
  };
  
  const etiquetaMes = (idx: number) => `${MESES[idx % 12].toLowerCase()} ${Math.floor(idx / 12)}`;
  
  /** Define el periodo actual y el anterior equivalente */
  function ventanas(envios: EnvioMock[], p: Periodo) {
    if (p.anio !== null) {
      const meses = p.mesIni === 1 && p.mesFin === 12 ? '' : ` (${MESES[p.mesIni - 1]}–${MESES[p.mesFin - 1]})`;
      return {
        actual: (e: EnvioMock) => e.a === p.anio && mesEnRango(e.m, p),
        anterior: (e: EnvioMock) => e.a === p.anio! - 1 && mesEnRango(e.m, p),
        etiquetas: [`${p.anio}${meses}`, `${p.anio - 1}${meses}`] as const,
      };
    }
    // Sin año: últimos 12 meses con datos frente a los 12 previos
    const ultimo = envios.reduce((mx, e) => Math.max(mx, e.a * 12 + e.m - 1), 0);
    const idx = (e: EnvioMock) => e.a * 12 + e.m - 1;
    return {
      actual: (e: EnvioMock) => idx(e) > ultimo - 12 && mesEnRango(e.m, p),
      anterior: (e: EnvioMock) => idx(e) <= ultimo - 12 && idx(e) > ultimo - 24 && mesEnRango(e.m, p),
      etiquetas: [
        `${etiquetaMes(ultimo - 11)} – ${etiquetaMes(ultimo)}`,
        `${etiquetaMes(ultimo - 23)} – ${etiquetaMes(ultimo - 12)}`,
      ] as const,
    };
  }
  
  const MIN_ENVIOS = 25; // por debajo de esto la comparación no es confiable
  const MIN_SHARE = 3; // solo entidades con al menos 3% en alguno de los dos periodos
  const MIN_DELTA = 2; // cambios menores a 2 puntos no se reportan
  
  function mayorCambio(ahora: Map<string, number>, antes: Map<string, number>, signo: 1 | -1) {
    let mejor: { sujeto: string; antes: number; ahora: number; d: number } | null = null;
    for (const k of new Set([...ahora.keys(), ...antes.keys()])) {
      const a = ahora.get(k) ?? 0;
      const b = antes.get(k) ?? 0;
      if (Math.max(a, b) < MIN_SHARE) continue;
      const d = (a - b) * signo;
      if (d >= MIN_DELTA && (!mejor || d > mejor.d)) mejor = { sujeto: k, antes: b, ahora: a, d };
    }
    return mejor;
  }
  
  function mesPico(envios: EnvioMock[]) {
    const porMes = Array(12).fill(0) as number[];
    envios.forEach((e) => (porMes[e.m - 1] += e.t));
    return porMes.indexOf(Math.max(...porMes)) + 1;
  }
  
  function comparar(actual: EnvioMock[], anterior: EnvioMock[], conDestino: boolean): Hallazgo[] {
    const out: Hallazgo[] = [];
    if (!conDestino) {
      const dA = participacion(actual, 'd');
      const dB = participacion(anterior, 'd');
      const sube = mayorCambio(dA, dB, 1);
      if (sube) out.push({ tipo: 'mercado_sube', sujeto: sube.sujeto, antes: sube.antes, ahora: sube.ahora });
      const baja = mayorCambio(dA, dB, -1);
      if (baja) out.push({ tipo: 'mercado_baja', sujeto: baja.sujeto, antes: baja.antes, ahora: baja.ahora });
    }
    const v = mayorCambio(participacion(actual, 'v'), participacion(anterior, 'v'), 1);
    if (v) out.push({ tipo: 'variedad_sube', sujeto: v.sujeto, antes: v.antes, ahora: v.ahora });
    const x = mayorCambio(participacion(actual, 'x'), participacion(anterior, 'x'), 1);
    if (x) out.push({ tipo: 'exportador_sube', sujeto: x.sujeto, antes: x.antes, ahora: x.ahora });
  
    out.push({ tipo: 'pico', sujeto: '', antes: mesPico(anterior), ahora: mesPico(actual) });
  
    if (!conDestino) {
      const top3 = (m: Map<string, number>) => [...m.values()].sort((a, b) => b - a).slice(0, 3).reduce((s, n) => s + n, 0);
      out.push({ tipo: 'concentracion', sujeto: '', antes: top3(participacion(anterior, 'd')), ahora: top3(participacion(actual, 'd')) });
    }
    return out.slice(0, 5);
  }
  
  export async function dashboardMock(p: DashboardParams): Promise<DashboardData> {
    const db = (await cargar())[p.crop];
    await new Promise((r) => setTimeout(r, 180)); // latencia simulada
  
    const deDestino = (e: EnvioMock) => !p.destino || e.d === p.destino;
    const enPeriodo = db.envios.filter((e) => (p.anio === null || e.a === p.anio) && mesEnRango(e.m, p));
    const conDestino = enPeriodo.filter(deDestino);
    const filtrado = p.anio !== null || p.mesIni !== 1 || p.mesFin !== 12;
  
    // Comparativo
    const w = ventanas(db.envios, p);
    const actual = db.envios.filter((e) => w.actual(e) && deDestino(e));
    const anterior = db.envios.filter((e) => w.anterior(e) && deDestino(e));
    const comparable = actual.length >= MIN_ENVIOS && anterior.length >= MIN_ENVIOS;
    const comparativo: Comparativo | null = comparable
      ? { actual: w.etiquetas[0], anterior: w.etiquetas[1], hallazgos: comparar(actual, anterior, !!p.destino) }
      : null;
    // Las listas y rankings muestran Δ solo cuando el periodo en pantalla ES el periodo comparado
    // (año elegido). En "todo el histórico" el comparativo usa los últimos 12 meses y mezclarlos confundiría.
    const deltaEnListas = comparable && p.anio !== null;
    const antesDe = (key: Clave) => (deltaEnListas ? participacion(anterior, key) : null);
    const ahoraDe = (key: Clave) => (deltaEnListas ? participacion(actual, key) : null);
  
    const calMap = new Map<string, CeldaCalendario>();
    for (const e of db.envios) {
      if (!deDestino(e)) continue;
      const key = `${e.a}-${e.m}`;
      const c = calMap.get(key) ?? { anio: e.a, mes: e.m, t: 0, envios: 0 };
      c.t += e.t;
      c.envios++;
      calMap.set(key, c);
    }
  
    const kpis = filtrado || p.destino
      ? {
          envios: conDestino.length,
          peso_t: conDestino.reduce((s, e) => s + e.t, 0),
          campos: new Set(conDestino.flatMap((e) => e.k)).size,
          destinos: new Set(conDestino.map((e) => e.d)).size,
          traza_pct: db.kpis.traza_pct,
        }
      : { envios: db.kpis.envios, peso_t: db.kpis.peso_t, campos: db.kpis.campos, destinos: db.dest.length, traza_pct: db.kpis.traza_pct };
  
    // Δ de participación por destino (solo tiene sentido sin filtro de destino)
    const dAhora = !p.destino ? ahoraDe('d') : null;
    const dAntes = !p.destino ? antesDe('d') : null;
    const conDelta = (c: Conteo): Conteo => ({
      ...c,
      delta_pp: dAhora && dAntes ? (dAhora.get(c.n) ?? 0) - (dAntes.get(c.n) ?? 0) : null,
    });
  
    const ultimo = db.envios.reduce((mx, e) => Math.max(mx, e.a * 12 + e.m - 1), 0);
  
    return {
      kpis,
      muestra: filtrado || !!p.destino,
      anios: db.anios,
      calendario: [...calMap.values()],
      destinos: (filtrado ? contar(enPeriodo, 'd') : db.dest.map((d) => ({ n: d.n, envios: d.e }))).map(conDelta),
      variedades: filtrado || p.destino ? contar(conDestino, 'v') : db.vars.map((v) => ({ n: v.n, envios: v.e })),
      exportadores: top(conDestino, 'x', ahoraDe('x'), antesDe('x')),
      importadores: top(conDestino, 'i', ahoraDe('i'), antesDe('i')),
      datos_hasta: { anio: Math.floor(ultimo / 12), mes: (ultimo % 12) + 1 },
      comparativo,
    };
  }