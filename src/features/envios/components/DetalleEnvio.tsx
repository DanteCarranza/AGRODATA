import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, Factory, Link2, Loader2, Ship, Sprout } from 'lucide-react';
import type { CropId } from '@/types/agro';
import { MESES_LARGO } from '@/config/crops';
import { Drawer } from '@/components/ui/Drawer';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import { useEnvio } from '../useEnvios';
import { COLOR_TRAZA, trazaDe } from '../traza';

/** Un eslabón de la cadena: icono + línea vertical que lo une con el siguiente */
function Eslabon({ icono: Icono, titulo: t, ultimo, children }: { icono: typeof Sprout; titulo: string; ultimo?: boolean; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[32px_1fr] gap-x-3">
      {!ultimo && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden />}
      <span className="crop-tint relative grid size-8 place-items-center rounded-full bg-crop-soft text-crop">
        <Icono className="size-4" />
      </span>
      <div className={cn('min-w-0 pt-1', !ultimo && 'pb-6')}>
        <h3 className="text-[12.5px] text-muted">{t}</h3>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}

export function DetalleEnvio({
  crop, id, onCerrar, onFicha, onFiltro,
}: {
  crop: CropId;
  id: string | null;
  onCerrar: () => void;
  onFicha: (exportador: string) => void;
  onFiltro: (c: Partial<Record<'destino' | 'importador' | 'variedad', string>>) => void;
}) {
  const { data: e, isPending } = useEnvio(crop, id);
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* el navegador bloqueó el portapapeles: no hacemos nada */
    }
  };

  const t = e ? trazaDe(e) : null;
  const totalAporte = e ? e.campos.reduce((s, c) => s + (c.kg ?? 0), 0) || 1 : 1;

  return (
    <Drawer
      abierto={!!id}
      onCerrar={onCerrar}
      etiqueta="Certificado de exportación"
      titulo={e ? <span className="num">Exp. {e.exp}</span> : 'Cargando'}
      subtitulo={e && <>{MESES_LARGO[e.mes - 1]} de {e.anio}{e.variedad ? `, ${titulo(e.variedad)}` : ''}</>}
      pie={
        e && (
          <div className="flex gap-2">
            <button
              onClick={() => onFicha(e.exportador)}
              className="crop-tint flex-1 rounded-lg bg-crop px-4 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110"
            >
              Ver ficha del exportador
            </button>
            <button
              onClick={copiar}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-[13.5px] hover:border-faint"
            >
              {copiado ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        )
      }
    >
      {isPending && <div className="flex items-center gap-2 py-10 text-muted"><Loader2 className="size-4 animate-spin" /> Cargando envío</div>}
      {!isPending && !e && <p className="py-10 text-muted">No encontramos este envío. Puede que pertenezca a otro cultivo.</p>}

      {e && t && (
        <div className="space-y-7">
          {/* Balance de pesos */}
          <section className={cn('rounded-xl p-4', COLOR_TRAZA[t.estado].fondo)}>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { l: 'Embarcado', v: `${fmt(e.peso_kg)} kg` },
                { l: 'Declarado por campos', v: e.aporte_kg === null ? 'Sin dato' : `${fmt(e.aporte_kg)} kg` },
                t.estado === 'completa'
                  ? { l: 'Merma en planta', v: `${fmt(t.merma_kg)} kg` }
                  : { l: 'Sin campo enlazado', v: `${fmt(t.sin_enlazar_kg)} kg` },
              ].map((x) => (
                <div key={x.l}>
                  <dt className="text-[12px] text-muted">{x.l}</dt>
                  <dd className="num mt-0.5 font-display text-[18px] leading-tight font-semibold">{x.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
              <div className={cn('h-full rounded-full', COLOR_TRAZA[t.estado].barra)} style={{ width: `${t.cobertura * 100}%` }} />
            </div>
            <p className={cn('mt-2 text-[13px] font-medium', COLOR_TRAZA[t.estado].texto)}>
              {t.estado === 'completa' && 'Trazabilidad completa: los campos respaldan todo el peso embarcado.'}
              {t.estado === 'parcial' && `Trazabilidad parcial: los campos respaldan el ${fmt1(t.cobertura * 100)}% del peso embarcado.`}
              {t.estado === 'sin' && 'Sin trazabilidad: ningún campo declara peso para este envío.'}
            </p>
            {t.estado === 'completa' && t.merma_kg > 0 && e.aporte_kg && (
              <p className="mt-0.5 text-[12.5px] text-muted">
                La merma equivale al {fmt1((t.merma_kg / e.aporte_kg) * 100)}% de lo que llegó de los campos.
              </p>
            )}
          </section>

          {/* Cadena del envío */}
          <ol>
            <Eslabon icono={Sprout} titulo={`Campos de origen (${e.campos.length})`}>
              {e.campos.length === 0 ? (
                <p className="text-[13.5px] text-faint">Este envío no tiene campos enlazados.</p>
              ) : (
                <ul className="space-y-2.5">
                  {e.campos.map((c) => (
                    <li key={c.clp}>
                    
                    
                    <Link to={`/campos?campo=${encodeURIComponent(c.clp)}`} className="group flex items-baseline gap-2 text-[13.5px]" title="Ver ficha del campo">
                        <span className="num shrink-0 rounded bg-surface px-1.5 py-px text-[11.5px] text-muted group-hover:bg-crop-soft group-hover:text-crop-ink">{c.clp}</span>
                        <span className="min-w-0 flex-1 truncate group-hover:text-crop group-hover:underline">{c.predio ? titulo(c.predio) : <span className="text-faint">Predio sin nombre</span>}</span>
                        <span className="num shrink-0 text-muted">{c.kg === null ? 'Sin peso' : `${fmt(c.kg)} kg`}</span>
                      </Link>


                      {c.kg !== null && (
                        <div className="mt-1 h-1 rounded-full bg-surface">
                          <div className="crop-tint h-full rounded-full bg-crop/70" style={{ width: `${(c.kg / totalAporte) * 100}%` }} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Eslabon>

            <Eslabon icono={Factory} titulo="Planta de empaque">
              <p className="text-[14px] font-medium">{e.planta ? titulo(e.planta) : 'Sin dato'}</p>
              <p className="num text-[12.5px] text-muted">
                {[e.planta_cod && `Código ${e.planta_cod}`, e.origen && titulo(e.origen)].filter(Boolean).join(', ')}
              </p>
            </Eslabon>

            <Eslabon icono={Building2} titulo="Exportador">
              <button onClick={() => onFicha(e.exportador)} className="text-left text-[14px] font-medium hover:text-crop hover:underline">
                {titulo(e.exportador)}
              </button>
            </Eslabon>

            <Eslabon icono={Ship} titulo="Comprador y destino" ultimo>
              {e.importador ? (
                <button onClick={() => onFiltro({ importador: e.importador })} className="block text-left text-[14px] font-medium hover:text-crop hover:underline" title="Ver todos los envíos a este importador">
                  {titulo(e.importador)}
                </button>
              ) : <p className="text-[14px] text-faint">Importador sin dato</p>}
              <button onClick={() => onFiltro({ destino: e.destino })} className="text-[13px] text-muted hover:text-crop hover:underline" title="Ver todos los envíos a este país">
                {titulo(e.destino)}
              </button>
            </Eslabon>
          </ol>
        </div>
      )}
    </Drawer>
  );
}