import type { CropId } from '@/types/agro';
import type { ResultadoBusqueda } from '@/features/busqueda/useBusqueda';

let indice: Record<string, ResultadoBusqueda[]> | null = null;

async function construir() {
  const data = (await import('./agro.json')).default as unknown as Record<
    string,
    { envios: { x: string; i: string; v: string; d: string; k: string[] }[] }
  >;
  const env = (await import('./envios.json')).default as unknown as Record<string, { predios: Record<string, string> }>;
  const out: Record<string, ResultadoBusqueda[]> = {};
  for (const [crop, { envios }] of Object.entries(data)) {
    const m = new Map<string, ResultadoBusqueda>();
    const add = (tipo: ResultadoBusqueda['tipo'], nombre: string, detalle?: string) => {
      if (!nombre) return;
      const k = `${tipo}:${nombre}`;
      const r = m.get(k) ?? { tipo, nombre, envios: 0, detalle };
      r.envios++;
      m.set(k, r);
    };
    envios.forEach((e) => {
      add('exportador', e.x);
      add('importador', e.i);
      add('variedad', e.v);
      add('destino', e.d);
      e.k.forEach((clp) => add('campo', clp, env[crop]?.predios[clp]));
    });
    out[crop] = [...m.values()].sort((a, b) => b.envios - a.envios);
  }
  return out;
}

export async function busquedaMock(crop: CropId, q: string): Promise<ResultadoBusqueda[]> {
  indice ??= await construir();
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  return indice[crop]
    .filter((r) => r.nombre.toLowerCase().includes(t) || r.detalle?.toLowerCase().includes(t))
    .slice(0, 40);
}