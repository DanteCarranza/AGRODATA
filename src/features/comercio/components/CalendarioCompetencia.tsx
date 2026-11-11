import type { ComercioData } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn } from '@/lib/format';

/** Un mes cuenta como "Perú embarcando" si concentra al menos el 4% del año */
const ACTIVO = 4;
const enumerar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

/** Ventana de exportación de Perú frente a los otros orígenes que abastecen los mismos mercados */
export function CalendarioCompetencia({ data, cultivo }: { data: ComercioData; cultivo: string }) {
  const { peru, competidores } = data.calendario;
  const maxPeru = Math.max(...peru, 1);
  const activos = peru.map((v) => v >= ACTIVO);
  const rivales = MESES.map((_, i) => competidores.filter((c) => c.meses.includes(i)).length);
  const mesesPeru = activos.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
  const menor = Math.min(...mesesPeru.map((i) => rivales[i]));
  const mayor = Math.max(...mesesPeru.map((i) => rivales[i]));
  // Si todos los meses de Perú tienen la misma competencia no hay una ventana que destacar
  const mejores = menor < mayor ? mesesPeru.filter((i) => rivales[i] === menor) : [];
  const todos = enumerar(competidores.map((c) => nombrePais(c.pais)));
  const nombres = enumerar(mejores.map((m) => MESES_LARGO[m].toLowerCase()));

  return (
    <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div className="max-w-3xl">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">Perú frente a sus competidores</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {mejores.length > 0 && menor === 0 ? (
            <>En <b className="font-semibold text-ink">{nombres}</b> Perú embarca {cultivo.toLowerCase()} sin que los otros grandes orígenes estén en temporada: es su ventana más libre.</>
          ) : mejores.length > 0 ? (
            <>Perú siempre comparte mercado con otros orígenes. Su ventana con menos competencia es <b className="font-semibold text-ink">{nombres}</b>, con {menor} {menor === 1 ? 'competidor' : 'competidores'} en temporada.</>
          ) : mesesPeru.length ? (
            <>Perú compite todos sus meses de embarque con {todos}: no hay una ventana libre de competencia.</>
          ) : (
            <>Meses en que cada origen tiene fruta para exportar.</>
          )}
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[150px_repeat(12,minmax(0,1fr))] gap-1 pb-1.5 text-[11.5px] text-muted">
            <span />
            {MESES.map((m, i) => (
              <span key={m} className={cn('text-center', mejores.includes(i) && 'crop-tint font-semibold text-crop')}>{m}</span>
            ))}
          </div>

          <div className="grid grid-cols-[150px_repeat(12,minmax(0,1fr))] items-center gap-1">
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <Bandera pais="PERU" />
              Perú
            </span>
            {peru.map((v, i) => (
              <div
                key={i}
                className={cn('crop-tint h-9 rounded-md', mejores.includes(i) && 'ring-2 ring-crop ring-offset-1')}
                style={{ background: v >= ACTIVO ? `color-mix(in oklab, var(--color-crop) ${Math.round(35 + (v / maxPeru) * 65)}%, var(--color-paper))` : 'var(--color-surface)' }}
                title={`${MESES_LARGO[i]}: ${Math.round(v)}% del año`}
              />
            ))}
          </div>

          <div className="mt-2 space-y-1">
            {competidores.map((c) => (
              <div key={c.pais} className="grid grid-cols-[150px_repeat(12,minmax(0,1fr))] items-center gap-1">
                <span className="flex items-center gap-2 text-[13px]">
                  <Bandera pais={c.pais} />
                  {nombrePais(c.pais)}
                </span>
                {MESES.map((_, i) => (
                  <div key={i} className={cn('h-7 rounded-md', c.meses.includes(i) ? 'bg-ink/25' : 'bg-surface')} title={`${nombrePais(c.pais)}, ${MESES_LARGO[i].toLowerCase()}`} />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[150px_repeat(12,minmax(0,1fr))] items-center gap-1 border-t border-line pt-3">
            <span className="text-[12px] text-muted">Competidores en temporada</span>
            {rivales.map((n, i) => (
              <span key={i} className={cn('num text-center text-[13px]', !activos[i] ? 'text-faint' : mejores.includes(i) ? 'crop-tint font-semibold text-crop' : 'text-ink')}>{n}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><span className="crop-tint size-2.5 rounded-sm bg-crop" />Perú: más intenso, más fruta ese mes (según los envíos)</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ink/25" />Otros orígenes en temporada</span>
      </div>
      <p className="mt-2 text-[12px] text-faint">
        Las ventanas de los otros países son la referencia pública del sector. Sus volúmenes exactos llegarán al integrar UN Comtrade.
      </p>
    </section>
  );
}