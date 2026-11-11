/**
 * Implementación en el navegador de:
 *   GET /api/balance   -> BalanceData
 *
 * Balance por código de lugar de producción individual (XXX-XXXXX-XX completo), nunca por empresa
 * ni por prefijo: los dos últimos dígitos son campos distintos.
 *   certificado = capacidad del certificado (área certificada × rendimiento)
 *   embarcado   = lo exportado bajo ese código en la campaña
 * En esta muestra solo uva trae certificados (campos.json). El filtro de periodo no aplica: el balance es por campaña.
 */
import type {
    BalanceCampo, BalanceData, BalanceParams, Conteo, EstadoSaldo,
  } from '@/types/agro';
  
  interface Estatico {
    predio: string | null;
    productor: string | null;
    region: string | null;
    cert: {
      area_ha: number | null;
      rend_t_ha: number | null;
      capacidad_t: number | null;
      exportado_campana_t: number | null;
      variedades: { v: string; ha: number | null }[];
    } | null;
    compradores: { n: string; share: number }[];
  }
  
  /**
   * Vigencias del balance oficial del prototipo (RAW.BAL, campaña 2025-26).
   * Los dos códigos que no están en campos.json entran con sus propias cifras.
   */
  const VIGENCIAS: { cod: string; razon: string; dep: string; var: string; cert: number; emb: number; ini: string; fin: string }[] = [
    { cod: '016-38621-09', razon: 'MANUELITA FYH S.A.C.', dep: 'ICA', var: 'IVORY', cert: 1003, emb: 879, ini: '2025-12-16', fin: '2026-06-30' },
    { cod: '016-01153-03', razon: 'EL PEDREGAL S.A.', dep: 'ICA', var: 'SUGRAFIFTYFOUR', cert: 1371, emb: 1143, ini: '2025-12-18', fin: '2026-03-31' },
    { cod: '009-23449-04', razon: 'AGROCASAGRANDE S.A.C', dep: 'LA LIBERTAD', var: 'SWEET CELEBRATION', cert: 2336, emb: 1735, ini: '2025-11-20', fin: '2026-02-28' },
    { cod: '016-36980-05', razon: 'RVR AGRO S.R.L.', dep: 'ICA', var: 'RED GLOBE', cert: 2236, emb: 1635, ini: '2025-12-15', fin: '2026-03-30' },
    { cod: '016-38713-03', razon: 'FRUTICOLA WAYU S.A.', dep: 'ICA', var: 'ALLISON', cert: 2293, emb: 369, ini: '2025-11-26', fin: '2026-05-15' },
    { cod: '016-00929-02', razon: 'SOCIEDAD AGRICOLA DON LUIS', dep: 'ICA', var: 'SWEET GLOBE', cert: 4768, emb: 741, ini: '2025-11-21', fin: '2026-06-30' },
    { cod: '016-54350-01', razon: 'SERVICIOS AGRICOLAS BELUMA', dep: 'ICA', var: 'SUPERIOR SEEDLESS', cert: 398, emb: 63, ini: '2025-11-14', fin: '2026-02-15' },
    { cod: '016-31752-02', razon: 'CAMPOS DEL SUR S.A.', dep: 'ICA', var: 'SWEET GLOBE', cert: 8456, emb: 49, ini: '2025-02-24', fin: '2026-01-30' },
    { cod: '002-06214-02', razon: 'AGRICOLA TUNGASUCA S.A.C', dep: 'PIURA', var: 'SWEET GLOBE', cert: 4404, emb: 15, ini: '2025-10-20', fin: '2026-01-30' },
    { cod: '002-26604-06', razon: 'SOCIEDAD EXPORTADORA VERFRUT', dep: 'PIURA', var: 'RED GLOBE', cert: 5146, emb: 16, ini: '2025-11-12', fin: '2026-05-30' },
  ];
  const CAMPANA = '2025-26';
  
  let cache: Record<string, Record<string, Estatico>> | null = null;
  const cargar = async () => (cache ??= (await import('./campos.json')).default as unknown as Record<string, Record<string, Estatico>>);
  const latencia = () => new Promise((r) => setTimeout(r, 150));
  
  /** Mismos cortes que el balance oficial del prototipo */
  export const estadoSaldo = (uso: number): EstadoSaldo => (uso > 100 ? 'sobregiro' : uso >= 90 ? 'agotado' : uso >= 50 ? 'uso' : 'alto');
  
  function vigencia(cod: string) {
    const v = VIGENCIAS.find((x) => x.cod === cod);
    if (!v) return null;
    return { ini: v.ini, fin: v.fin, vencido: new Date(`${v.fin}T23:59:59`) < new Date() };
  }
  
  function armar(clp: string, e: Partial<Estatico> & { cert: NonNullable<Estatico['cert']> }): BalanceCampo | null {
    const cert = e.cert.capacidad_t;
    const emb = e.cert.exportado_campana_t ?? 0;
    if (!cert) return null;
    const uso = (emb / cert) * 100;
    return {
      clp,
      predio: e.predio ?? null,
      productor: e.productor ?? null,
      region: e.region ?? null,
      variedades: [...e.cert.variedades].sort((a, b) => (b.ha ?? 0) - (a.ha ?? 0)),
      area_ha: e.cert.area_ha,
      rend_t_ha: e.cert.rend_t_ha,
      certificado_t: cert,
      embarcado_t: emb,
      saldo_t: cert - emb,
      uso_pct: uso,
      estado: estadoSaldo(uso),
      vigencia: vigencia(clp),
      exportador_principal: e.compradores?.[0]?.n ?? null,
    };
  }
  
  async function todos(crop: string) {
    const est = (await cargar())[crop] ?? {};
    const filas = Object.entries(est)
      .filter(([, e]) => e.cert)
      .map(([clp, e]) => armar(clp, e as Estatico & { cert: NonNullable<Estatico['cert']> }))
      .filter((f): f is BalanceCampo => !!f);
  
    if (crop === 'uva') {
      VIGENCIAS.filter((v) => !est[v.cod]?.cert).forEach((v) => {
        const f = armar(v.cod, {
          predio: null,
          productor: v.razon || null,
          region: v.dep,
          compradores: [],
          cert: { area_ha: null, rend_t_ha: null, capacidad_t: v.cert, exportado_campana_t: v.emb, variedades: [{ v: v.var, ha: null }] },
        });
        if (f) filas.push(f);
      });
    }
    return filas;
  }
  
  const ORDEN: Record<BalanceParams['orden'], (a: BalanceCampo, b: BalanceCampo) => number> = {
    saldo: (a, b) => b.saldo_t - a.saldo_t,
    uso: (a, b) => b.uso_pct - a.uso_pct,
    certificado: (a, b) => b.certificado_t - a.certificado_t,
  };
  
  export async function balanceMock(p: BalanceParams): Promise<BalanceData> {
    const base = await todos(p.crop);
    await latencia();
  
    const q = p.q.trim().toLowerCase();
    const pasa = (f: BalanceCampo, omitirEstado = false) =>
      (!p.region || f.region === p.region) &&
      (omitirEstado || !p.estado || f.estado === p.estado) &&
      (!q || [f.clp, f.predio, f.productor, f.region, f.exportador_principal, ...f.variedades.map((v) => v.v)].join(' ').toLowerCase().includes(q));
  
    const sinEstado = base.filter((f) => pasa(f, true));
    const filas = sinEstado.filter((f) => !p.estado || f.estado === p.estado).sort(ORDEN[p.orden]);
  
    const estados: Record<EstadoSaldo, number> = { alto: 0, uso: 0, agotado: 0, sobregiro: 0 };
    sinEstado.forEach((f) => estados[f.estado]++);
  
    const regiones = new Map<string, number>();
    base.forEach((f) => f.region && regiones.set(f.region, (regiones.get(f.region) ?? 0) + 1));
  
    return {
      disponible: base.length > 0,
      campana: base.length ? CAMPANA : null,
      resumen: {
        campos: filas.length,
        certificado_t: filas.reduce((s, f) => s + f.certificado_t, 0),
        embarcado_t: filas.reduce((s, f) => s + f.embarcado_t, 0),
        saldo_t: filas.reduce((s, f) => s + Math.max(0, f.saldo_t), 0),
        estados,
        vencidos: filas.filter((f) => f.vigencia?.vencido).length,
      },
      regiones: [...regiones.entries()].map(([n, envios]): Conteo => ({ n, envios })).sort((a, b) => b.envios - a.envios),
      oportunidades: [...filas].filter((f) => f.saldo_t > 0).sort(ORDEN.saldo).slice(0, 5),
      alertas: [...filas].filter((f) => f.estado === 'sobregiro' || f.estado === 'agotado').sort(ORDEN.uso),
      filas,
    };
  }