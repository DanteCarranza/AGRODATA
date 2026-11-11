import { USE_MOCKS } from '@/lib/api';
import { aCsv, descargar } from '@/lib/csv';
import { MESES } from '@/config/crops';
import type { EnviosParams } from '@/types/agro';
import { ETIQUETA_TRAZA, trazaDe } from './traza';

type Params = Omit<EnviosParams, 'offset' | 'limit'>;

/** Descarga TODOS los envíos que cumplen el filtro (no solo los cargados en pantalla) */
export async function exportarEnvios(p: Params) {
  const nombre = `envios_${p.crop}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (!USE_MOCKS) {
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v !== null && v !== '' && qs.set(k, String(v)));
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/envios/exportar?${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`No se pudo exportar (${res.status})`);
    return descargar(await res.blob(), nombre);
  }

  const { enviosTodosMock } = await import('@/mocks/envios.mock');
  const filas = await enviosTodosMock(p);
  const blob = aCsv(
    [
      'Año', 'Mes', 'N.° expediente', 'Exportador', 'Importador', 'Destino', 'Variedad', 'Peso neto (kg)',
      'Aporte de campos (kg)', 'Trazabilidad', 'Cobertura (%)', 'Sin campo enlazado (kg)', 'Merma en planta (kg)',
      'Campos (CLP)', 'Predios', 'Planta', 'Código de planta', 'Origen',
    ],
    filas.map((f) => {
      const t = trazaDe(f);
      return [
        f.anio, MESES[f.mes - 1], f.exp, f.exportador, f.importador, f.destino, f.variedad, f.peso_kg,
        f.aporte_kg, ETIQUETA_TRAZA[t.estado], Math.round(t.cobertura * 1000) / 10, t.sin_enlazar_kg, t.merma_kg,
        f.campos.map((c) => c.clp).join(', '),
        f.campos.map((c) => c.predio ?? '').filter(Boolean).join(', '),
        f.planta, f.planta_cod, f.origen,
      ];
    }),
  );
  descargar(blob, nombre);
}