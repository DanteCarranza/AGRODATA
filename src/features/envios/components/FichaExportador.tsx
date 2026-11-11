import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { CropId, Periodo } from '@/types/agro';
import { MESES } from '@/config/crops';
import { Drawer } from '@/components/ui/Drawer';
import { fmt, titulo } from '@/lib/format';
import { useFichaExportador } from '../useEnvios';

function Barras({ filas, onElegir }: { filas: { n: string; kg: number }[]; onElegir?: (n: string) => void }) {
  const max = filas[0]?.kg || 1;
  return (
    <ul className="space-y-2">
      {filas.map((f) => {
        const contenido = (
          <>
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="truncate">{titulo(f.n)}</span>
              <span className="num shrink-0 text-muted">{fmt(f.kg / 1000)} t</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface">
              <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(f.kg / max) * 100}%` }} />
            </div>
          </>
        );
        return (
          <li key={f.n}>
            {onElegir ? (
              <button onClick={() => onElegir(f.n)} className="w-full rounded-md text-left hover:text-crop" title="Ver solo los envíos a este importador">
                {contenido}
              </button>
            ) : contenido}
          </li>
        );
      })}
    </ul>
  );
}

export function Seccion({ titulo: t, detalle, children }: { titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-display text-[15px] font-semibold">{t}</h3>
      {detalle ? <p className="mt-0.5 mb-3 text-[12.5px] text-muted">{detalle}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export function FichaExportador({
  crop, nombre, periodo, onCerrar, onVerEnvios, onImportador,
}: {
  crop: CropId;
  nombre: string | null;
  periodo: Periodo;
  onCerrar: () => void;
  onVerEnvios: (exportador: string) => void;
  onImportador: (exportador: string, importador: string) => void;
}) {
  const { data, isPending } = useFichaExportador(crop, nombre, periodo);
  const maxMes = data ? Math.max(1, ...data.mensual) : 1;

  return (
    <Drawer
      abierto={!!nombre}
      onCerrar={onCerrar}
      etiqueta="Ficha del exportador"
      titulo={nombre ? titulo(nombre) : ''}
      pie={
        nombre && (
          <button
            onClick={() => onVerEnvios(nombre)}
            className="crop-tint w-full rounded-lg bg-crop px-4 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110"
          >
            Ver solo sus envíos
          </button>
        )
      }
    >
      <div className="space-y-6">
        {isPending && (
          <div className="flex items-center gap-2 py-10 text-muted"><Loader2 className="size-4 animate-spin" /> Cargando ficha</div>
        )}
        {!isPending && !data && (
          <p className="py-10 text-muted">Este exportador no tiene envíos en el periodo elegido. Amplía el periodo desde la barra superior.</p>
        )}
        {data && nombre && (
          <>
            <dl className="grid grid-cols-2 gap-y-4">
              {[
                { v: fmt(data.envios), l: 'envíos' },
                { v: fmt(data.peso_kg / 1000), l: 'toneladas netas' },
                { v: fmt(data.destinos.length), l: data.destinos.length === 1 ? 'destino' : 'destinos' },
                { v: fmt(data.campos.length), l: 'campos que usa' },
              ].map((x) => (
                <div key={x.l}>
                  <dd className="num font-display text-[26px] leading-none font-semibold">{x.v}</dd>
                  <dt className="mt-1 text-[12.5px] text-muted">{x.l}</dt>
                </div>
              ))}
            </dl>

            <Seccion titulo="Cuándo exporta" detalle="Toneladas por mes en el periodo elegido.">
              <div className="flex h-24 items-end gap-1">
                {data.mensual.map((kg, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${MESES[i]}: ${fmt(kg / 1000)} t`}>
                    <div className="crop-tint rounded-t-[3px] bg-crop" style={{ height: `${(kg / maxMes) * 100}%`, minHeight: kg ? 3 : 0, opacity: kg ? 1 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1">
                {MESES.map((m) => <span key={m} className="flex-1 text-center text-[10.5px] text-muted">{m.charAt(0)}</span>)}
              </div>
            </Seccion>

            <Seccion titulo="Destinos">
              <Barras filas={data.destinos} />
            </Seccion>

            {data.importadores.length > 0 && (
              <Seccion titulo="A quién le vende" detalle="Elige un importador para ver solo esos envíos.">
                <Barras filas={data.importadores} onElegir={(imp) => onImportador(nombre, imp)} />
              </Seccion>
            )}

            {data.campos.length > 0 && (
              <Seccion titulo="Campos de donde sale su fruta" detalle="Cuánto saca este exportador de cada campo frente a todo lo que ese campo envió.">
                <ul className="divide-y divide-line">
                  {data.campos.map((c) => {
                    const pct = c.kg_total_campo ? Math.round((c.kg / c.kg_total_campo) * 100) : 100;
                    return (
                      <li key={c.clp} className="py-2.5">
                      
                      
                      <Link to={`/campos?campo=${encodeURIComponent(c.clp)}`} className="group flex items-baseline gap-2 text-[13px]" title="Ver ficha del campo">
                          <span className="num shrink-0 rounded bg-surface px-1.5 py-px text-[11.5px] text-muted group-hover:bg-crop-soft group-hover:text-crop-ink">{c.clp}</span>
                          <span className="min-w-0 flex-1 truncate group-hover:text-crop group-hover:underline">{c.predio ? titulo(c.predio) : 'Predio sin nombre'}</span>
                          <span className="num shrink-0 font-medium">{pct}%</span>
                        </Link>


                        <p className="mt-1 text-[12px] text-muted">
                          {fmt(c.kg / 1000)} t de este exportador, de {fmt(c.kg_total_campo / 1000)} t que salieron del campo
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </Seccion>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}