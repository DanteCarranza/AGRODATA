import { Link } from 'react-router-dom';
import type { Ranking } from '@/types/agro';
import { Delta } from '@/components/ui/Delta';
import { fmt, fmt1, titulo } from '@/lib/format';

export function TablaRanking({
  filas, entidad, enlace,
}: {
  filas: Ranking[];
  entidad: string;
  /** a dónde lleva el nombre al hacer clic */
  enlace?: (nombre: string) => string;
}) {
  if (!filas.length) return <p className="py-6 text-[13px] text-muted">No hay {entidad} con envíos en este periodo.</p>;
  const max = filas[0].t || 1;
  const conCambio = filas.some((r) => r.delta_pp !== null && r.delta_pp !== undefined);

  return (
    <div className="-mx-5 overflow-x-auto scroll-thin">
      <table className="w-full min-w-[380px] table-fixed text-[13.5px]">
        <colgroup><col className="w-10" /><col /><col className="w-24" /><col className="w-24" /></colgroup>
        <thead>
          <tr className="text-left text-[12px] text-muted">
            <th className="py-2 pl-5 font-normal">#</th>
            <th className="py-2 font-normal">Empresa</th>
            <th className="py-2 text-right font-normal" title="Porción de las toneladas del periodo y su cambio frente al periodo anterior">Participación</th>
            <th className="py-2 pr-5 text-right font-normal">Toneladas</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((r, i) => (
            <tr key={r.n} className="border-t border-line hover:bg-surface">
              <td className="num py-2.5 pl-5 align-top text-faint">{i + 1}</td>
              <td className="py-2.5 pr-3">
                {enlace ? (
                  <Link to={enlace(r.n)} className="block truncate hover:text-crop hover:underline" title={titulo(r.n)}>{titulo(r.n)}</Link>
                ) : (
                  <div className="truncate" title={titulo(r.n)}>{titulo(r.n)}</div>
                )}
                <div className="mt-1 h-1 rounded-full bg-surface">
                  <div className="crop-tint h-full rounded-full bg-crop/70" style={{ width: `${(r.t / max) * 100}%` }} />
                </div>
                <div className="num mt-1 text-[11.5px] text-faint">
                  {fmt(r.envios)} {r.envios === 1 ? 'envío' : 'envíos'}, {r.destinos} {r.destinos === 1 ? 'destino' : 'destinos'}
                </div>
              </td>
              <td className="num py-2.5 text-right align-top">
                {r.share !== undefined && <div className="font-medium">{fmt1(r.share)}%</div>}
                {conCambio && <Delta pp={r.delta_pp} />}
              </td>
              <td className="num py-2.5 pr-5 text-right align-top font-medium">{fmt(r.t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}