import type { Conteo } from '@/types/agro';
import { fmt, titulo } from '@/lib/format';

/** Barra 100% apilada + leyenda: la mezcla varietal se lee de un vistazo */
export function Variedades({ variedades }: { variedades: Conteo[] }) {
  if (!variedades.length) return <p className="py-6 text-[13px] text-muted">Sin variedades registradas en este periodo.</p>;

  const total = variedades.reduce((s, v) => s + v.envios, 0);
  const top = variedades.slice(0, 6);
  const otras = total - top.reduce((s, v) => s + v.envios, 0);
  const filas = otras > 0 ? [...top, { n: 'Otras variedades', envios: otras }] : top;
  const opacidad = (i: number) => (i === filas.length - 1 && otras > 0 ? 0.14 : 1 - i * 0.14);

  return (
    <div>
      <div className="flex h-9 overflow-hidden rounded-lg" role="img" aria-label="Participación por variedad">
        {filas.map((v, i) => (
          <div
            key={v.n}
            className="crop-tint h-full border-r-2 border-paper last:border-r-0"
            style={{ width: `${(v.envios / total) * 100}%`, background: `color-mix(in oklab, var(--color-crop) ${opacidad(i) * 100}%, white)` }}
            title={`${titulo(v.n)}: ${fmt(v.envios)} envíos`}
          />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {filas.map((v, i) => (
          <li key={v.n} className="flex items-center gap-3 py-2 text-[13.5px]">
            <span
              className="crop-tint size-3 shrink-0 rounded-[3px]"
              style={{ background: `color-mix(in oklab, var(--color-crop) ${opacidad(i) * 100}%, white)` }}
              aria-hidden
            />
            <span className="truncate">{v.n === 'Otras variedades' ? v.n : titulo(v.n)}</span>
            <span className="num ml-auto text-muted">{fmt(v.envios)}</span>
            <span className="num w-12 text-right font-medium">{((v.envios / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}