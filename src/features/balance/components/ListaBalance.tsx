import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight } from 'lucide-react';
import type { BalanceCampo } from '@/types/agro';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import { ESTADO_SALDO, fecha } from '../estado';

function Vigencia({ v }: { v: BalanceCampo['vigencia'] }) {
  if (!v) return <span className="text-faint">Vigencia sin dato</span>;
  return (
    <span className={cn('inline-flex items-center gap-1', v.vencido ? 'text-faint' : 'text-ok')}>
      <CalendarClock className="size-3.5" aria-hidden />
      {v.vencido ? `Venció el ${fecha(v.fin)}` : `Vigente hasta el ${fecha(v.fin)}`}
    </span>
  );
}

/** Una fila por código: lo certificado, lo embarcado y lo que queda */
function Fila({ f }: { f: BalanceCampo }) {
  const e = ESTADO_SALDO[f.estado];
  const usado = Math.min(f.uso_pct, 100);
  const vencido = f.vigencia?.vencido;

  return (
    <li>
      <Link
        to={`/campos?campo=${encodeURIComponent(f.clp)}`}
        className="group grid gap-x-6 gap-y-3 px-5 py-4 hover:bg-surface/60 md:grid-cols-[minmax(240px,1fr)_minmax(300px,1.5fr)_96px_16px] md:items-center"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('size-2.5 shrink-0 rounded-full', e.barra)} aria-hidden />
            <span className="truncate text-[14px] font-medium group-hover:text-crop-ink">
              {f.predio ? titulo(f.predio) : titulo(f.productor ?? f.clp)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-[18px] text-[12px] text-muted">
            <span className="num rounded bg-surface px-1.5 py-px text-[11px]">{f.clp}</span>
            {f.region && <span>{titulo(f.region)}</span>}
            {f.predio && f.productor && <span className="truncate">· {titulo(f.productor)}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1 pl-[18px]">
            {f.variedades.slice(0, 3).map((v) => (
              <span key={v.v} className="crop-tint rounded-md bg-crop-soft px-1.5 py-0.5 text-[11.5px] text-crop-ink">
                {titulo(v.v)}{v.ha ? <span className="num text-crop-ink/60"> {fmt1(v.ha)} ha</span> : null}
              </span>
            ))}
            {f.variedades.length > 3 && <span className="px-1 text-[11.5px] text-muted">+{f.variedades.length - 3}</span>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="relative flex h-3 overflow-hidden rounded-full bg-surface" role="img" aria-label={`Usado ${Math.round(f.uso_pct)}% del certificado`}>
            <span className={cn('h-full', vencido ? 'bg-faint' : e.barra)} style={{ width: `${Math.max(1, usado)}%` }} />
            {f.estado === 'sobregiro' && <span className="absolute inset-y-0 right-0 w-1 bg-ink" title="Supera lo certificado" />}
          </div>
          <div className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>Certificado <b className="font-medium text-ink">{fmt(f.certificado_t)} t</b></span>
            <span>Embarcado <b className="font-medium text-ink">{fmt1(f.embarcado_t)} t</b></span>
            <span className={f.saldo_t >= 0 ? 'text-ok' : 'text-bad'}>
              {f.saldo_t >= 0 ? 'Saldo' : 'Exceso'} <b className="font-semibold">{fmt(Math.abs(f.saldo_t))} t</b>
            </span>
          </div>
          <div className="mt-1 text-[12px]"><Vigencia v={f.vigencia} /></div>
        </div>

        <div className="md:text-right">
          <div className={cn('num font-display text-[22px] leading-none font-semibold', e.texto)}>
            {f.uso_pct < 1 && f.uso_pct > 0 ? '<1' : Math.round(f.uso_pct)}%
          </div>
          <div className="mt-1 text-[12px] text-muted">{e.titulo.toLowerCase()}</div>
        </div>
        <ChevronRight className="hidden size-4 text-line group-hover:text-muted md:block" aria-hidden />
      </Link>
    </li>
  );
}

const PASO = 20;

/** Muestra de 20 en 20 para no alargar la página; el padre la remonta (key) al cambiar filtros */
export function ListaBalance({ filas }: { filas: BalanceCampo[] }) {
  const [visibles, setVisibles] = useState(PASO);
  return (
    <>
      <ul className="divide-y divide-line">
        {filas.slice(0, visibles).map((f) => <Fila key={f.clp} f={f} />)}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[12.5px] text-muted">
        <span className="num">Mostrando {fmt(Math.min(visibles, filas.length))} de {fmt(filas.length)} campos</span>
        {visibles < filas.length && (
          <button
            onClick={() => setVisibles((v) => v + PASO)}
            className="crop-tint rounded-lg border border-line px-3 py-1.5 font-medium text-crop hover:border-crop"
          >
            Ver {fmt(Math.min(PASO, filas.length - visibles))} más
          </button>
        )}
      </div>
    </>
  );
}