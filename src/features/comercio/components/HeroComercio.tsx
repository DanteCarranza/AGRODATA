import { Link } from 'react-router-dom';
import type { ComercioData } from '@/types/agro';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { fmt, fmt1, fmtCorto } from '@/lib/format';

/** Cabecera oscura: el tamaño de la exportación peruana del cultivo y a dónde va */
export function HeroComercio({ data, cultivo }: { data: ComercioData; cultivo: string }) {
  const t = data.totales;
  const max = Math.max(1, ...data.destinos.map((d) => d.share));

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-forest text-white">
      <div
        aria-hidden
        className="crop-tint absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            'radial-gradient(700px 320px at 95% -10%, color-mix(in oklab, var(--color-crop) 55%, transparent), transparent 70%),' +
            'radial-gradient(500px 260px at -5% 110%, color-mix(in oklab, var(--color-mint) 14%, transparent), transparent 70%)',
        }}
      />
      <div className="grid gap-10 p-6 sm:p-8 xl:grid-cols-[minmax(300px,0.9fr)_1.2fr]">
        <div className="flex flex-col">
          <p className="text-[12.5px] text-white/60">Exportación peruana de {cultivo.toLowerCase()}, base oficial completa</p>
          <div className="num mt-3 font-display text-[64px] leading-[0.9] font-semibold tracking-[-0.04em] text-mint">
            {fmtCorto(t.peso_t)}<span className="ml-2 text-[30px]">t</span>
          </div>
          <p className="mt-3 max-w-[40ch] text-[14px] leading-snug text-white/80">
            embarcadas en {fmt(t.envios)} envíos hacia {fmt(t.destinos)} países, desde {fmt(t.campos)} campos certificados.
          </p>
          {data.partida && (
            <div className="mt-6 rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <div className="text-[11.5px] text-white/50">Partida arancelaria</div>
              <div className="num mt-0.5 font-display text-[18px] font-semibold tracking-tight">{data.partida.codigo}</div>
              <div className="mt-0.5 text-[12.5px] text-white/70">{data.partida.descripcion}</div>
            </div>
          )}
          <p className="mt-auto pt-6 text-[12px] text-white/45">Fuente: MIDAGRI, MINCETUR y MEF.</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[12.5px] text-white/60">A dónde va, por número de envíos</p>
            <Link to="/" className="text-[12.5px] text-mint hover:underline">Ver en el dashboard</Link>
          </div>
          <ul className="mt-4 space-y-2.5">
            {data.destinos.map((d, i) => (
              <li key={d.n} className="grid grid-cols-[22px_minmax(0,150px)_1fr_56px] items-center gap-3 text-[13px]">
                <span className="num text-[12px] text-white/40">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <Bandera pais={d.n} />
                  <span className="truncate">{nombrePais(d.n)}</span>
                </span>
                <span className="h-2 rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-mint" style={{ width: `${(d.share / max) * 100}%`, opacity: 1 - i * 0.06 }} />
                </span>
                <span className="num text-right text-white/80">{fmt1(d.share)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}