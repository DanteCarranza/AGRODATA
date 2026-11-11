import { Link } from 'react-router-dom';
import type { Comparativo, Hallazgo } from '@/types/agro';
import { MESES_LARGO } from '@/config/crops';
import { cn, fmt1, titulo } from '@/lib/format';

interface Lectura {
  titulo: string;
  detalle: string;
  /** texto grande a la izquierda */
  cifra: string;
  unidad: string;
  tono: 'sube' | 'baja' | 'neutro';
  barras: boolean;
  enlace?: { label: string; to: string };
}

const pct = (n: number) => `${fmt1(n)}%`;
const mes = (m: number) => MESES_LARGO[m - 1].toLowerCase();
const q = encodeURIComponent;

/** Convierte el dato estructurado del backend en una frase para el usuario */
function leer(h: Hallazgo): Lectura {
  const d = h.ahora - h.antes;
  const cifraPp = `${d > 0 ? '+' : '−'}${fmt1(Math.abs(d))}`;
  const nuevo = h.antes < 0.5;
  const s = titulo(h.sujeto);

  switch (h.tipo) {
    case 'mercado_sube':
      return {
        titulo: `${s} gana mercado`,
        detalle: `Pasó de ${pct(h.antes)} a ${pct(h.ahora)} de las toneladas exportadas.`,
        cifra: cifraPp, unidad: 'puntos', tono: 'sube', barras: true,
        enlace: { label: `Ver envíos a ${s}`, to: `/envios?destino=${q(h.sujeto)}` },
      };
    case 'mercado_baja':
      return {
        titulo: `${s} pierde peso`,
        detalle: `Bajó de ${pct(h.antes)} a ${pct(h.ahora)} de las toneladas exportadas.`,
        cifra: cifraPp, unidad: 'puntos', tono: 'baja', barras: true,
        enlace: { label: `Ver envíos a ${s}`, to: `/envios?destino=${q(h.sujeto)}` },
      };
    case 'variedad_sube':
      return {
        titulo: `${s} avanza`,
        detalle: nuevo
          ? `Variedad que no figuraba antes: ya representa ${pct(h.ahora)} de las toneladas.`
          : `Pasó de ${pct(h.antes)} a ${pct(h.ahora)} de las toneladas.`,
        cifra: cifraPp, unidad: 'puntos', tono: 'sube', barras: true,
        enlace: { label: `Ver envíos de ${s}`, to: `/envios?variedad=${q(h.sujeto)}` },
      };
    case 'exportador_sube':
      return {
        titulo: nuevo ? `${s} entra con fuerza` : `${s} crece`,
        detalle: nuevo
          ? `No exportaba en el periodo anterior y ya mueve ${pct(h.ahora)} de las toneladas.`
          : `Pasó de ${pct(h.antes)} a ${pct(h.ahora)} de las toneladas.`,
        cifra: cifraPp, unidad: 'puntos', tono: 'sube', barras: true,
        enlace: { label: 'Ver ficha', to: `/envios?exportador=${q(h.sujeto)}&ficha=${q(h.sujeto)}` },
      };
    case 'pico': {
      // desplazamiento circular: -1 = un mes antes
      const corrimiento = ((h.ahora - h.antes + 18) % 12) - 6;
      if (corrimiento === 0)
        return {
          titulo: `El pico se mantiene en ${mes(h.ahora)}`,
          detalle: 'Es el mismo mes de mayor volumen que en el periodo anterior.',
          cifra: '=', unidad: 'mismo mes', tono: 'neutro', barras: false,
        };
      const n = Math.abs(corrimiento);
      return {
        titulo: `El pico se ${corrimiento < 0 ? 'adelantó' : 'atrasó'} a ${mes(h.ahora)}`,
        detalle: `En el periodo anterior el mes de mayor volumen fue ${mes(h.antes)}.`,
        cifra: `${corrimiento < 0 ? '−' : '+'}${n}`, unidad: n === 1 ? 'mes' : 'meses', tono: 'neutro', barras: false,
      };
    }
    case 'concentracion':
      return {
        titulo: d >= 0 ? 'Los envíos se concentran más' : 'Los envíos se reparten más',
        detalle: `Los 3 principales destinos suman ${pct(h.ahora)} de las toneladas (antes ${pct(h.antes)}).`,
        cifra: cifraPp, unidad: 'puntos', tono: 'neutro', barras: true,
      };
  }
}

function Barras({ antes, ahora }: { antes: number; ahora: number }) {
  const max = Math.max(antes, ahora, 1);
  return (
    <div className="w-full space-y-1.5 sm:w-40" aria-hidden>
      {[
        { l: 'Antes', v: antes, c: 'bg-faint/50' },
        { l: 'Ahora', v: ahora, c: 'bg-crop' },
      ].map((b) => (
        <div key={b.l} className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-[11px] text-muted">{b.l}</span>
          <div className="h-1.5 flex-1 rounded-full bg-surface">
            <div className={cn('crop-tint h-full rounded-full', b.c)} style={{ width: `${(b.v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Hallazgos({ comparativo }: { comparativo: Comparativo | null }) {
  if (!comparativo) {
    return (
      <p className="py-4 text-[13px] text-muted">
        No hay suficientes envíos en el periodo anterior para comparar. Elige otro año o vuelve a todo el histórico.
      </p>
    );
  }
  if (!comparativo.hallazgos.length) {
    return <p className="py-4 text-[13px] text-muted">Sin cambios relevantes entre {comparativo.anterior} y {comparativo.actual}.</p>;
  }

  return (
    <ul className="-mx-5 divide-y divide-line">
      {comparativo.hallazgos.map((h) => {
        const l = leer(h);
        return (
          <li key={h.tipo} className="grid grid-cols-[76px_1fr] items-start gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-[92px_1fr_auto] sm:items-center">
            <div className="leading-none">
              <div
                className={cn(
                  'num font-display text-[26px] font-semibold tracking-tight sm:text-[30px]',
                  l.tono === 'sube' && 'text-ok',
                  l.tono === 'baja' && 'text-bad',
                  l.tono === 'neutro' && 'crop-tint text-crop',
                )}
              >
                {l.cifra}
              </div>
              <div className="mt-1 text-[11.5px] text-muted">{l.unidad}</div>
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-medium">{l.titulo}</p>
              <p className="mt-0.5 text-[13px] text-muted">{l.detalle}</p>
              {l.enlace && (
                <Link to={l.enlace.to} className="crop-tint mt-1.5 inline-block text-[13px] font-medium text-crop hover:underline">
                  {l.enlace.label}
                </Link>
              )}
            </div>
            {l.barras && (
              <div className="col-start-2 sm:col-start-3">
                <Barras antes={h.antes} ahora={h.ahora} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}