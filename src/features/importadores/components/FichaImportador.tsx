import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Link2, Loader2 } from 'lucide-react';
import type { CropId, Periodo } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Drawer } from '@/components/ui/Drawer';

import { Bandera } from '@/components/ui/Bandera';
import { nombrePais } from '@/lib/paises';
import { Seccion } from '@/features/envios/components/FichaExportador';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import { mesesClave } from '@/lib/temporada';
import { useFichaImportador } from '../useImportadores';
import { TendenciaBadge } from '../tendencia';

const q = encodeURIComponent;

/** Meses que suman al menos el 70% de sus compras, en orden de temporada (dic antes que ene) */
/*function mesesClave(meses: number[]) {
    const total = meses.reduce((s, v) => s + v, 0);
    if (!total) return { lista: [] as number[], pct: 0 };
    const orden = meses.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const lista: number[] = [];
    let acum = 0;
    for (const m of orden) {
      if (acum / total >= 0.7) break;
      lista.push(m.i);
      acum += m.v;
    }
    const cruzaAnio = lista.includes(11) && lista.includes(0);
    lista.sort((a, b) => (cruzaAnio ? ((a + 6) % 12) - ((b + 6) % 12) : a - b));
    return { lista, pct: (acum / total) * 100 };
  }*/



const enumerar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

function Barras({ filas, max, enlace }: { filas: { n: string; share: number; extra?: string }[]; max: number; enlace?: (n: string) => string }) {
  return (
    <ul className="space-y-2">
      {filas.map((f) => {
        const cuerpo = (
          <>
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="truncate">{titulo(f.n)}</span>
              <span className="num shrink-0 text-muted">{f.extra ? `${f.extra}, ` : ''}{fmt1(f.share)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface">
              <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(f.share / (max || 1)) * 100}%` }} />
            </div>
          </>
        );
        return (
          <li key={f.n}>
            {enlace ? <Link to={enlace(f.n)} className="block hover:text-crop">{cuerpo}</Link> : cuerpo}
          </li>
        );
      })}
    </ul>
  );
}

export function FichaImportador({
  crop, nombre, periodo, onCerrar,
}: {
  crop: CropId;
  nombre: string | null;
  periodo: Periodo;
  onCerrar: () => void;
}) {
  const { data: f, isPending } = useFichaImportador(crop, nombre, periodo);
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles bloqueado */
    }
  };

  const clave = f ? mesesClave(f.meses) : null;
  const maxMes = f ? Math.max(1, ...f.meses) : 1;
  const maxAnio = f ? Math.max(0.1, ...f.por_anio.map((a) => a.share)) : 1;
  const temporada = clave ? enumerar(clave.lista.map((m) => MESES_LARGO[m].toLowerCase())) : '';

  return (
    <Drawer
      abierto={!!nombre}
      onCerrar={onCerrar}
      etiqueta="Perfil del importador"
      titulo={nombre ? titulo(nombre) : ''}
      subtitulo={
        f && (
         
            <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5"><Bandera pais={f.pais} />{nombrePais(f.pais)}</span>

            {f.tendencia && <TendenciaBadge t={f.tendencia} compacto />}
          </span>
        )
      }
      pie={
        f && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/envios?importador=${q(f.nombre)}`)}
              className="crop-tint flex-1 rounded-lg bg-crop px-4 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110"
            >
              Ver sus envíos
            </button>
            <button onClick={copiar} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-[13.5px] hover:border-faint">
              {copiado ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        )
      }
    >
      {isPending && <div className="flex items-center gap-2 py-10 text-muted"><Loader2 className="size-4 animate-spin" /> Cargando perfil</div>}
      {!isPending && !f && <p className="py-10 text-muted">Este importador no tiene compras en el periodo elegido. Amplía el periodo desde la barra superior.</p>}

      {f && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            {[
              { v: fmt(f.t), l: 'toneladas' },
              { v: fmt(f.envios), l: 'envíos' },
              { v: `${fmt1(f.share)}%`, l: 'del cultivo' },
              { v: fmt(f.proveedores.length), l: f.proveedores.length === 1 ? 'proveedor' : 'proveedores' },
            ].map((x) => (
              <div key={x.l}>
                <dd className="num font-display text-[22px] leading-none font-semibold">{x.v}</dd>
                <dt className="mt-1 text-[12px] text-muted">{x.l}</dt>
              </div>
            ))}
          </dl>

          <Seccion
            titulo="Cuándo compra"
            detalle={clave && clave.lista.length ? `Concentra el ${Math.round(clave.pct)}% de sus compras en ${temporada}. Esa es la ventana para ofrecerle.` : undefined}
          >
            <div className="flex h-24 items-end gap-1">
              {f.meses.map((t, i) => {
                const pico = clave?.lista.includes(i);
                return (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${MESES_LARGO[i]}: ${fmt1(t)} t`}>
                    <div className={cn('crop-tint rounded-t-[3px]', pico ? 'bg-crop' : 'bg-crop/35')} style={{ height: `${(t / maxMes) * 100}%`, minHeight: t ? 3 : 0 }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex gap-1">
              {MESES.map((m, i) => (
                <span key={m} className={cn('flex-1 text-center text-[10.5px]', clave?.lista.includes(i) ? 'font-semibold text-crop' : 'text-muted')}>{m.charAt(0)}</span>
              ))}
            </div>
          </Seccion>

          {f.por_anio.length > 1 && (
            <Seccion titulo="Su peso en el mercado" detalle="Qué parte de las toneladas del cultivo compró cada año.">
              <div className="flex h-24 items-end gap-1.5">
                {f.por_anio.map((a) => (
                  <div key={a.anio} className="flex h-full flex-1 flex-col justify-end" title={`${a.anio}: ${fmt1(a.share)}%`}>
                    <div className="crop-tint rounded-t-[3px] bg-crop/70" style={{ height: `${(a.share / maxAnio) * 100}%`, minHeight: a.share ? 3 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1.5">
                {f.por_anio.map((a) => <span key={a.anio} className="num flex-1 text-center text-[10.5px] text-muted">{String(a.anio).slice(2)}</span>)}
              </div>
            </Seccion>
          )}

          {f.variedades.length > 0 && (
            <Seccion titulo="Qué compra">
              <Barras filas={f.variedades.slice(0, 6)} max={f.variedades[0].share} />
            </Seccion>
          )}

          {f.proveedores.length > 0 && (
            <Seccion titulo="Quién le vende hoy" detalle="Exportadores peruanos que le enviaron fruta. Elige uno para ver su ficha.">
              <Barras
                filas={f.proveedores.slice(0, 8).map((p) => ({ n: p.n, share: p.share, extra: `${p.envios} ${p.envios === 1 ? 'envío' : 'envíos'}` }))}
                max={f.proveedores[0].share}
                enlace={(n) => `/envios?exportador=${q(n)}&ficha=${q(n)}`}
              />
            </Seccion>
          )}

          <Seccion
            titulo="Campos que podrían abastecerlo"
            detalle={
              f.variedades[0]
                ? `Campos con ${titulo(f.variedades[0].n)} que hoy no le venden. Son proveedores posibles para su temporada.`
                : undefined
            }
          >
            {f.campos_sugeridos.length ? (
              <ul className="divide-y divide-line">
                {f.campos_sugeridos.map((c) => (
                  <li key={c.clp}>
                    <Link to={`/campos?campo=${q(c.clp)}`} className="group flex items-center gap-3 py-2.5 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="num shrink-0 rounded bg-surface px-1.5 py-px text-[11.5px] text-muted group-hover:bg-crop-soft group-hover:text-crop-ink">{c.clp}</span>
                          <span className="truncate group-hover:text-crop group-hover:underline">{c.predio ? titulo(c.predio) : 'Predio sin nombre'}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted">
                          {[c.region && titulo(c.region), c.exportador_principal && `vende a ${titulo(c.exportador_principal)}`].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div className="num shrink-0 text-right">
                        <div className="font-medium">{fmt1(c.t)} t</div>
                        {c.uso_pct !== null && <div className="text-[11.5px] text-faint">{Math.round(c.uso_pct)}% de capacidad usada</div>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted">No encontramos otros campos con su variedad principal en este periodo.</p>
            )}
          </Seccion>

          <Seccion titulo="Contacto comercial">
            {f.contacto ? (
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                {[
                  ['Web', f.contacto.web], ['Correo', f.contacto.email], ['Teléfono', f.contacto.telefono], ['LinkedIn', f.contacto.linkedin],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12px] text-muted">{k}</dt>
                    <dd className={cn('truncate', !v && 'text-faint')}>{v ?? 'Sin dato'}</dd>
                  </div>
                ))}
                <p className="col-span-2 text-[12px] text-muted">Verificado el {f.contacto.verificado}. Solo datos corporativos de la empresa.</p>
              </dl>
            ) : (
              <p className="text-[13px] text-muted">Todavía no tenemos datos de contacto verificados de esta empresa.</p>
            )}
          </Seccion>
        </div>
      )}
    </Drawer>
  );
}