import { Leaf, Plane, Ship, Truck, type LucideIcon } from 'lucide-react';
import type { ComercioData, ModoTransporte } from '@/types/agro';
import { useFiltros } from '@/store/filtros';
import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { cn, fmt, fmt1 } from '@/lib/format';

const MODO: Record<ModoTransporte, { l: string; icono: LucideIcon; color: string }> = {
  MARITIMO: { l: 'Marítimo', icono: Ship, color: 'bg-[#2f5f8a]' },
  TERRESTRE: { l: 'Terrestre', icono: Truck, color: 'bg-[#b5600a]' },
  AEREO: { l: 'Aéreo', icono: Plane, color: 'bg-[#a23b2a]' },
};
const ORDEN: ModoTransporte[] = ['MARITIMO', 'TERRESTRE', 'AEREO'];

function SoloLimon({ titulo, icono: Icono, cultivo }: { titulo: string; icono: LucideIcon; cultivo: string }) {
  const setCrop = useFiltros((s) => s.setCrop);
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-surface text-muted"><Icono className="size-5" aria-hidden /></span>
        <h2 className="font-display text-[16px] font-semibold tracking-tight">{titulo}</h2>
      </div>
      <p className="mt-3 text-[13px] text-muted">
        Por ahora este detalle está procesado solo para limón Tahití. Para {cultivo.toLowerCase()} llega en cuanto se procese la misma
        columna de la base oficial.
      </p>
      <button onClick={() => setCrop('limon')} className="crop-tint mt-auto self-start rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-crop hover:border-crop">
        Ver limón Tahití
      </button>
    </section>
  );
}

/** Cómo viaja la fruta y qué parte es orgánica */
export function TransporteOrganico({ data, cultivo }: { data: ComercioData; cultivo: string }) {
  const tr = data.transporte;
  const org = data.organico;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {tr ? (
        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">Cómo viaja</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">Medio de transporte, en % del volumen. El destino lo define casi todo.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ORDEN.map((k) => {
              const m = MODO[k];
              const Icono = m.icono;
              const pct = tr.modos.find((x) => x.k === k)?.pct ?? 0;
              return (
                <div key={k} className="rounded-xl bg-surface/70 p-3.5">
                  <div className="flex items-center gap-2 text-[12.5px] text-muted">
                    <span className={cn('grid size-6 place-items-center rounded-md text-white', m.color)}><Icono className="size-3.5" aria-hidden /></span>
                    {m.l}
                  </div>
                  <div className="num mt-2 font-display text-[26px] leading-none font-semibold">{pct < 1 && pct > 0 ? '<1' : fmt(pct)}%</div>
                </div>
              );
            })}
          </div>
          <ul className="mt-5 space-y-2.5">
            {tr.por_destino.map((d) => (
              <li key={d.n} className="grid grid-cols-[minmax(0,170px)_1fr] items-center gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2"><Bandera pais={d.n} /><span className="truncate">{nombrePais(d.n)}</span></span>
                <span className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-surface">
                  {ORDEN.map((k) => (d.modos[k] ?? 0) > 0.5 && (
                    <span key={k} className={cn('h-full', MODO[k].color)} style={{ width: `${d.modos[k]}%` }} title={`${MODO[k].l}: ${fmt1(d.modos[k]!)}%`} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            {ORDEN.map((k) => <span key={k} className="flex items-center gap-1.5"><span className={cn('size-2.5 rounded-sm', MODO[k].color)} />{MODO[k].l}</span>)}
          </div>
        </section>
      ) : (
        <SoloLimon titulo="Cómo viaja" icono={Ship} cultivo={cultivo} />
      )}

      {org ? (
        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-ok/10 text-ok"><Leaf className="size-5" aria-hidden /></span>
            <h2 className="font-display text-[16px] font-semibold tracking-tight">Orgánico</h2>
          </div>
          <div className="num mt-4 font-display text-[44px] leading-none font-semibold text-ok">{fmt1(org.pct_volumen)}%</div>
          <p className="mt-1 text-[13px] text-muted">del volumen sale como orgánico certificado, en {fmt(org.envios_organicos)} envíos.</p>

          <div className="mt-5">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-muted">Exportadores que ya envían orgánico</span>
              <span className="num font-medium">{fmt(org.exportadores_organicos)} de {fmt(org.exportadores_total)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-surface">
              <div className="h-full rounded-full bg-ok" style={{ width: `${(org.exportadores_organicos / org.exportadores_total) * 100}%` }} />
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-ok/5 p-3 text-[12.5px] leading-relaxed text-muted ring-1 ring-ok/15">
            Es un segmento chico y con pocos jugadores. Cuando crucemos estos envíos con el valor FOB de aduanas se verá cuánto más se
            paga por el orgánico.
          </p>
        </section>
      ) : (
        <SoloLimon titulo="Orgánico frente a convencional" icono={Leaf} cultivo={cultivo} />
      )}
    </div>
  );
}