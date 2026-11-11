import { USE_MOCKS } from '@/lib/api';
import { aCsv, descargar } from '@/lib/csv';
import type { CamposParams } from '@/types/agro';

type Params = Omit<CamposParams, 'offset' | 'limit'>;

/** Descarga todos los campos que cumplen el filtro */
export async function exportarCampos(p: Params) {
  const nombre = `campos_${p.crop}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (!USE_MOCKS) {
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v !== null && v !== '' && qs.set(k, String(v)));
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/campos/exportar?${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`No se pudo exportar (${res.status})`);
    return descargar(await res.blob(), nombre);
  }

  const { camposTodosMock } = await import('@/mocks/campos.mock');
  const filas = await camposTodosMock(p);
  descargar(
    aCsv(
      ['CLP', 'Predio', 'Productor', 'Región', 'Variedad principal', 'Exportador principal', 'N.° de exportadores', 'Envíos', 'Toneladas', 'Uso de campaña (%)', 'Con GPS'],
      filas.map((f) => [
        f.clp, f.predio, f.productor, f.region, f.variedad, f.exportador_principal, f.exportadores, f.envios,
        Math.round(f.t * 10) / 10, f.uso_pct === null ? null : Math.round(f.uso_pct), f.gps ? 'Sí' : 'No',
      ]),
    ),
    nombre,
  );
}