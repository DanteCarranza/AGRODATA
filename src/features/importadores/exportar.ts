import { USE_MOCKS } from '@/lib/api';
import { aCsv, descargar } from '@/lib/csv';
import { MESES } from '@/config/crops';
import type { ImportadoresParams } from '@/types/agro';

type Params = Omit<ImportadoresParams, 'offset' | 'limit'>;

const ETIQUETA = { crece: 'Crece', estable: 'Estable', cae: 'Cae', nuevo: 'Nuevo', inactivo: 'Dejó de comprar' } as const;

/** Descarga todos los importadores que cumplen el filtro */
export async function exportarImportadores(p: Params) {
  const nombre = `importadores_${p.crop}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (!USE_MOCKS) {
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v !== null && v !== '' && qs.set(k, String(v)));
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/importadores/exportar?${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`No se pudo exportar (${res.status})`);
    return descargar(await res.blob(), nombre);
  }

  const { importadoresTodosMock } = await import('@/mocks/importadores.mock');
  const filas = await importadoresTodosMock(p);
  descargar(
    aCsv(
      ['Puesto', 'Importador', 'País', 'Toneladas', 'Participación (%)', 'Envíos', 'Variedad principal', '% de esa variedad', 'Meses de compra', 'Proveedores', 'Tendencia', 'Cambio (pts)'],
      filas.map((f, i) => [
        i + 1, f.n, f.pais, Math.round(f.t * 10) / 10, Math.round(f.share * 100) / 100, f.envios, f.variedad,
        Math.round(f.variedad_share), f.meses.map((v, m) => (v ? MESES[m] : '')).filter(Boolean).join(' '),
        f.proveedores, f.tendencia ? ETIQUETA[f.tendencia] : 'Sin datos suficientes',
        f.delta_pp === null ? null : Math.round(f.delta_pp * 100) / 100,
      ]),
    ),
    nombre,
  );
}