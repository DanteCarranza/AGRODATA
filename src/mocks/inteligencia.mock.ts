/**
 * Implementación en el navegador de:
 *   GET /api/inteligencia/oportunidades  -> IntelOportunidades
 *   GET /api/inteligencia/saturacion     -> IntelSaturacion
 *   GET /api/inteligencia/variedades     -> IntelVariedades
 *   GET /api/inteligencia/variedad       -> DetalleVariedad
 *
 * Todo sale de los envíos: patrones de compra por mes, competencia peruana por destino y peso de cada variedad.
 * No se usan precios: los FOB del prototipo son de referencia y no se presentan como reales.
 * Del filtro de periodo solo se usa el año; los meses se leen completos para ver la temporada entera.
 */
import type {
    CropId, DetalleVariedad, IntelOportunidades, IntelParams, IntelSaturacion, IntelVariedades, OportunidadImportador,
    SaturacionDestino, VariedadIntel,
  } from '@/types/agro';
  import { MESES } from '@/config/crops';
  
  interface FilaEnvio {
    anio: number; mes: number; exportador: string; importador: string; destino: string; variedad: string; peso_kg: number;
    campos: { clp: string }[];
  }
  
  let cache: Record<string, { filas: FilaEnvio[] }> | null = null;
  const cargar = async () => (cache ??= (await import('./envios.json')).default as unknown as Record<string, { filas: FilaEnvio[] }>);
  const latencia = () => new Promise((r) => setTimeout(r, 150));
  
  async function filasDe(p: IntelParams) {
    const { filas } = (await cargar())[p.crop];
    return { todas: filas, filas: p.anio === null ? filas : filas.filter((f) => f.anio === p.anio) };
  }
  
  const sumar = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const masFrecuente = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const reparto = (meses: number[]) => {
    const tot = meses.reduce((s, v) => s + v, 0) || 1;
    return meses.map((v) => (v / tot) * 100);
  };
  
  /* ---------- periodo actual vs anterior (misma regla que el dashboard y el ranking) ---------- */
  
  const MIN_ENVIOS = 25;
  const idx = (f: { anio: number; mes: number }) => f.anio * 12 + f.mes - 1;
  const etiquetaMes = (i: number) => `${MESES[i % 12].toLowerCase()} ${Math.floor(i / 12)}`;
  
  function ventanas(filas: FilaEnvio[], anio: number | null) {
    if (anio !== null) {
      return {
        actual: (f: FilaEnvio) => f.anio === anio,
        anterior: (f: FilaEnvio) => f.anio === anio - 1,
        etiquetas: { actual: `${anio}`, anterior: `${anio - 1}` },
      };
    }
    const ultimo = filas.reduce((mx, f) => Math.max(mx, idx(f)), 0);
    return {
      actual: (f: FilaEnvio) => idx(f) > ultimo - 12,
      anterior: (f: FilaEnvio) => idx(f) <= ultimo - 12 && idx(f) > ultimo - 24,
      etiquetas: {
        actual: `${etiquetaMes(ultimo - 11)} – ${etiquetaMes(ultimo)}`,
        anterior: `${etiquetaMes(ultimo - 23)} – ${etiquetaMes(ultimo - 12)}`,
      },
    };
  }
  
  function comparar(todas: FilaEnvio[], anio: number | null) {
    const w = ventanas(todas, anio);
    const a = todas.filter(w.actual);
    const b = todas.filter(w.anterior);
    if (a.length < MIN_ENVIOS || b.length < MIN_ENVIOS) return null;
    return { a, b, etiquetas: w.etiquetas };
  }
  
  /* ---------- a quién venderle ahora ---------- */
  
  const MIN_ENVIOS_IMPORTADOR = 5;
  const MIN_PCT_VENTANA = 40;
  
  export async function oportunidadesMock(p: IntelParams): Promise<IntelOportunidades> {
    const { filas } = await filasDe(p);
    await latencia();
    const hoy = new Date().getMonth();
    const ventana = [0, 1, 2].map((d) => (hoy + d) % 12);
  
    const m = new Map<string, { meses: number[]; envios: number; dest: Map<string, number>; vars: Map<string, number>; exps: Set<string> }>();
    for (const f of filas) {
      if (!f.importador) continue;
      const r = m.get(f.importador) ?? { meses: Array(12).fill(0), envios: 0, dest: new Map(), vars: new Map(), exps: new Set<string>() };
      r.meses[f.mes - 1] += f.peso_kg / 1000;
      r.envios++;
      sumar(r.dest, f.destino, 1);
      if (f.variedad) sumar(r.vars, f.variedad, f.peso_kg);
      r.exps.add(f.exportador);
      m.set(f.importador, r);
    }
  
    const importadores: OportunidadImportador[] = [];
    for (const [n, r] of m) {
      if (r.envios < MIN_ENVIOS_IMPORTADOR) continue;
      const t = r.meses.reduce((s, v) => s + v, 0);
      const tVentana = ventana.reduce((s, i) => s + r.meses[i], 0);
      const pct = t ? (tVentana / t) * 100 : 0;
      if (pct < MIN_PCT_VENTANA) continue;
      const pico = r.meses.indexOf(Math.max(...r.meses));
      importadores.push({
        n,
        pais: masFrecuente(r.dest) ?? '',
        variedad: masFrecuente(r.vars),
        meses: r.meses,
        pct_ventana: pct,
        t_ventana: tVentana,
        mes_pico: pico,
        faltan: (pico - hoy + 12) % 12,
        t,
        envios: r.envios,
        proveedores: r.exps.size,
      });
    }
    importadores.sort((a, b) => b.t_ventana - a.t_ventana);
  
    const paises = new Map<string, { importadores: number; t_ventana: number }>();
    importadores.forEach((i) => {
      const x = paises.get(i.pais) ?? { importadores: 0, t_ventana: 0 };
      x.importadores++;
      x.t_ventana += i.t_ventana;
      paises.set(i.pais, x);
    });
  
    return {
      ventana,
      importadores: importadores.slice(0, 60),
      paises: [...paises.entries()].map(([n, x]) => ({ n, ...x })).sort((a, b) => b.t_ventana - a.t_ventana),
    };
  }
  
  /* ---------- cuándo se llena cada mercado ---------- */
  
  const LLENO = 1.5 * (100 / 12); // un mes "lleno" recibe al menos 1,5 veces lo de un mes promedio
  
  export async function saturacionMock(p: IntelParams): Promise<IntelSaturacion> {
    const { filas } = await filasDe(p);
    await latencia();
  
    const peru = Array(12).fill(0);
    const dest = new Map<string, { t: number; meses: number[]; exps: Set<string>[] }>();
    for (const f of filas) {
      peru[f.mes - 1] += f.peso_kg;
      const d = dest.get(f.destino) ?? { t: 0, meses: Array(12).fill(0), exps: Array.from({ length: 12 }, () => new Set<string>()) };
      d.t += f.peso_kg / 1000;
      d.meses[f.mes - 1] += f.peso_kg;
      d.exps[f.mes - 1].add(f.exportador);
      dest.set(f.destino, d);
    }
  
    const destinos: SaturacionDestino[] = [...dest.entries()]
      .sort((a, b) => b[1].t - a[1].t)
      .slice(0, 10)
      .map(([n, d]) => {
        const meses = reparto(d.meses);
        return {
          n,
          t: d.t,
          meses,
          exportadores: d.exps.map((s) => s.size),
          llenos: meses.map((v, i) => (v >= LLENO ? i : -1)).filter((i) => i >= 0),
        };
      });
  
    return { peru: reparto(peru), destinos };
  }
  
  /* ---------- variedades ---------- */
  
  export async function variedadesMock(p: IntelParams): Promise<IntelVariedades> {
    const { todas, filas } = await filasDe(p);
    await latencia();
    const total = filas.reduce((s, f) => s + f.peso_kg, 0) || 1;
  
    const m = new Map<string, { kg: number; meses: number[]; dest: Map<string, number>; imps: Set<string> }>();
    for (const f of filas) {
      if (!f.variedad) continue;
      const r = m.get(f.variedad) ?? { kg: 0, meses: Array(12).fill(0), dest: new Map(), imps: new Set<string>() };
      r.kg += f.peso_kg;
      r.meses[f.mes - 1] += f.peso_kg / 1000;
      sumar(r.dest, f.destino, f.peso_kg);
      if (f.importador) r.imps.add(f.importador);
      m.set(f.variedad, r);
    }
  
    // Cambio de participación: solo para variedades con al menos 3 envíos en cada periodo
    const cmp = comparar(todas, p.anio);
    const partes = (xs: FilaEnvio[]) => {
      const tot = xs.reduce((s, f) => s + f.peso_kg, 0) || 1;
      const r = new Map<string, { share: number; envios: number }>();
      xs.forEach((f) => {
        const x = r.get(f.variedad) ?? { share: 0, envios: 0 };
        x.share += (f.peso_kg / tot) * 100;
        x.envios++;
        r.set(f.variedad, x);
      });
      return r;
    };
    const ahora = cmp ? partes(cmp.a) : null;
    const antes = cmp ? partes(cmp.b) : null;
  
    const variedades: VariedadIntel[] = [...m.entries()]
      .map(([n, r]) => {
        const a = ahora?.get(n);
        const b = antes?.get(n);
        const comparable = !!a && !!b && a.envios >= 3 && b.envios >= 3;
        return {
          n,
          t: r.kg / 1000,
          share: (r.kg / total) * 100,
          delta_pp: comparable ? a!.share - b!.share : null,
          meses: r.meses,
          destino_principal: masFrecuente(r.dest),
          importadores: r.imps.size,
        };
      })
      .sort((a, b) => b.t - a.t);
  
    return { comparativo: cmp ? cmp.etiquetas : null, variedades };
  }
  
  export async function detalleVariedadMock(crop: CropId, anio: number | null, variedad: string): Promise<DetalleVariedad | null> {
    const { todas, filas } = await filasDe({ crop, anio });
    await latencia();
    const propias = filas.filter((f) => f.variedad === variedad);
    if (!propias.length) return null;
  
    const mesesDe = (xs: FilaEnvio[]) => {
      const meses = Array(12).fill(0);
      xs.forEach((f) => (meses[f.mes - 1] += f.peso_kg));
      return reparto(meses);
    };
    const cmp = comparar(todas, anio);
    const a = cmp?.a.filter((f) => f.variedad === variedad) ?? [];
    const b = cmp?.b.filter((f) => f.variedad === variedad) ?? [];
    const usarCmp = a.length >= 3 && b.length >= 3;
  
    const kg = propias.reduce((s, f) => s + f.peso_kg, 0) || 1;
    const dest = new Map<string, number>();
    const imps = new Map<string, number>();
    const impPais = new Map<string, Map<string, number>>();
    const exps = new Map<string, number>();
    const campos = new Set<string>();
    // La misma empresa a veces viene escrita con distinta capitalización: se agrupa por nombre normalizado
    const nombreDe = new Map<string, string>();
    propias.forEach((f) => {
      sumar(dest, f.destino, f.peso_kg);
      if (f.importador) {
        const k = f.importador.trim().toUpperCase();
        if (!nombreDe.has(k)) nombreDe.set(k, f.importador);
        sumar(imps, k, f.peso_kg);
        const pm = impPais.get(k) ?? new Map<string, number>();
        sumar(pm, f.destino, 1);
        impPais.set(k, pm);
      }
      sumar(exps, f.exportador, f.peso_kg);
      f.campos.forEach((c) => campos.add(c.clp));
    });
    const top = (mm: Map<string, number>, n: number) => [...mm.entries()].sort((x, y) => y[1] - x[1]).slice(0, n);
  
    return {
      n: variedad,
      comparativo: usarCmp ? cmp!.etiquetas : null,
      meses_actual: usarCmp ? mesesDe(a) : mesesDe(propias),
      meses_anterior: usarCmp ? mesesDe(b) : null,
      destinos: top(dest, 6).map(([n, v]) => ({ n, share: (v / kg) * 100 })),
      importadores: top(imps, 6).map(([k, v]) => ({ n: nombreDe.get(k)!, pais: masFrecuente(impPais.get(k)!) ?? '', t: v / 1000 })),
      exportadores: top(exps, 6).map(([n, v]) => ({ n, t: v / 1000 })),
      campos: campos.size,
    };
  }