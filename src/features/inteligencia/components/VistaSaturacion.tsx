import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { IntelSaturacion, SaturacionDestino } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt } from '@/lib/format';

const enumerar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
const mesesTexto = (ms: number[]) => enumerar(ms.map((m) => MESES_LARGO[m].toLowerCase()));
/** Intensidad de la celda: 25% del año en un mes ya es el máximo de la escala */
const alfa = (v: number) => Math.min(1, v / 25);

function Celda({ v, lleno }: { v: number; lleno: boolean }) {
  return (
    <div
      className="crop-tint relative grid h-9 place-items-center rounded-[5px] text-[10.5px]"
      style={{ background: v ? `color-mix(in oklab, var(--color-crop) ${Math.round(8 + alfa(v) * 92)}%, var(--color-paper))` : 'var(--color-surface)' }}
      title={`${Math.round(v)}% del año`}
    >
      <span className={cn('num', alfa(v) > 0.45 ? 'text-white' : 'text-muted', v < 1 && 'opacity-0')}>{Math.round(v)}</span>
      {lleno && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-white/90 ring-1 ring-crop" aria-label="Mes lleno" />}
    </div>
  );
}

function Detalle({ d, cultivo }: { d: SaturacionDestino; cultivo: string }) {
  const llenos = d.llenos;
  const pctLlenos = llenos.reduce((s, m) => s + d.meses[m], 0);
  const maxExp = Math.max(...d.exportadores);
  const mesMaxExp = d.exportadores.indexOf(maxExp);
  // Meses con fruta peruana llegando pero poca competencia: menos de la mitad de un mes promedio
  const tranquilos = d.meses.map((v, i) => (v > 0 && v < 100 / 24 ? i : -1)).filter((i) => i >= 0);
  const max = Math.max(...d.meses, 1);

  return (
    <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Bandera pais={d.n} className="h-4 w-6" />
            {fmt(d.t)} t de {cultivo.toLowerCase()} recibidas
          </div>
          <h3 className="mt-2 font-display text-[24px] leading-tight font-semibold tracking-tight">
            {llenos.length
              ? <>{nombrePais(d.n)} se llena en <span className="crop-tint text-crop">{mesesTexto(llenos)}</span></>
              : <>{nombrePais(d.n)} recibe fruta peruana de forma pareja todo el año</>}
          </h3>
          <p className="mt-2 text-[13.5px] text-muted">
            {llenos.length > 0 && <>En esos meses llega el {Math.round(pctLlenos)}% de lo que recibe en el año. </>}
            El mes con más competencia es {MESES_LARGO[mesMaxExp].toLowerCase()}, con {fmt(maxExp)} exportadores peruanos enviando a la vez.
            {tranquilos.length > 0 && <> En {mesesTexto(tranquilos)} llega muy poca fruta peruana: menos competencia, aunque también menos demanda comprobada.</>}
          </p>
        </div>
        <Link
          to={`/envios?destino=${encodeURIComponent(d.n)}`}
          className="crop-tint inline-flex items-center gap-1 text-[13px] font-medium text-crop hover:underline"
        >
          Ver sus envíos <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex h-40 items-end gap-1.5">
            {d.meses.map((v, i) => {
              const lleno = llenos.includes(i);
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${MESES_LARGO[i]}: ${Math.round(v)}% del año`}>
                  {v >= 1 && <span className={cn('num text-[11px]', lleno ? 'font-semibold text-crop-ink' : 'text-muted')}>{Math.round(v)}%</span>}
                  <div
                    className={cn('crop-tint w-full rounded-t-[4px]', lleno ? 'bg-crop' : 'bg-crop/30')}
                    style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5 border-t border-line pt-1.5">
            {MESES.map((m, i) => (
              <span key={m} className={cn('flex-1 text-center text-[11.5px]', llenos.includes(i) ? 'font-semibold text-crop' : 'text-muted')}>{m}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {d.exportadores.map((n, i) => (
              <div
                key={i}
                className="flex-1 rounded-md py-1.5 text-center"
                style={{ background: `rgba(162, 59, 42, ${maxExp ? 0.06 + (n / maxExp) * 0.3 : 0})` }}
                title={`${MESES_LARGO[i]}: ${n} exportadores`}
              >
                <span className="num text-[12px] font-medium">{n || '–'}</span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-muted">Exportadores peruanos que le enviaron en cada mes. Más rojo, más competencia.</p>
        </div>
      </div>
    </section>
  );
}

/** Calendario de llegada por destino: cuándo se concentra la fruta peruana y cuánta competencia hay */
export function VistaSaturacion({
  data, cultivo, destino, onDestino,
}: {
  data: IntelSaturacion;
  cultivo: string;
  destino: string | null;
  onDestino: (d: string) => void;
}) {
  const sel = data.destinos.find((d) => d.n === destino) ?? data.destinos[0];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] font-semibold tracking-tight">Cuándo llega la fruta peruana a cada mercado</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              % de lo que recibe cada destino en el año, mes a mes. Los meses con punto están llenos: reciben al menos 1,5 veces un mes
              promedio y suele haber más presión sobre el precio. Elige un destino para ver el detalle.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[200px_repeat(12,minmax(0,1fr))] gap-1 pb-1 text-[11.5px] text-muted">
              <span />
              {MESES.map((m) => <span key={m} className="text-center">{m}</span>)}
            </div>
            <div className="grid grid-cols-[200px_repeat(12,minmax(0,1fr))] items-center gap-1 border-b border-line pb-2">
              <span className="text-[12.5px] font-medium">Todo Perú</span>
              {data.peru.map((v, i) => <Celda key={i} v={v} lleno={false} />)}
            </div>
            <div className="mt-2 space-y-1">
              {data.destinos.map((d) => {
                const on = sel?.n === d.n;
                return (
                  <button
                    key={d.n}
                    onClick={() => onDestino(d.n)}
                    aria-pressed={on}
                    className={cn(
                      'crop-tint grid w-full grid-cols-[200px_repeat(12,minmax(0,1fr))] items-center gap-1 rounded-lg p-0.5 text-left',
                      on ? 'bg-crop-soft ring-1 ring-crop/40' : 'hover:bg-surface',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 pl-1.5 text-[12.5px]">
                      <Bandera pais={d.n} />
                      <span className={cn('truncate', on && 'font-medium text-crop-ink')}>{nombrePais(d.n)}</span>
                      <span className="num ml-auto pr-2 text-[11px] whitespace-nowrap text-faint">{fmt(d.t)} t</span>
                    </span>
                    {d.meses.map((v, i) => <Celda key={i} v={v} lleno={d.llenos.includes(i)} />)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {sel && <Detalle d={sel} cultivo={cultivo} />}
    </div>
  );
}