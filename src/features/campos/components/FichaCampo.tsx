import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExternalLink, Link2, Loader2 } from 'lucide-react';
import type { CropId, FichaCampo as Ficha, Periodo } from '@/types/agro';
import { MESES, MESES_LARGO } from '@/config/crops';
import { Drawer } from '@/components/ui/Drawer';
import { Seccion } from '@/features/envios/components/FichaExportador';
import { cn, fmt, fmt1, titulo } from '@/lib/format';
import { useFichaCampo } from '../useCampos';
import { colorUso } from './TablaCampos';

const q = encodeURIComponent;

function urlMapa(f: Ficha) {
  if (f.gps) return `https://www.google.com/maps?q=${f.gps.lat},${f.gps.lng}`;
  const u = f.ubicacion;
  const texto = [u.direccion, u.sector, u.distrito, u.provincia, u.region, 'Perú'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${q(texto)}`;
}

/** Un dato con su etiqueta. `nombre` capitaliza textos que vienen en mayúsculas; las cifras se muestran tal cual */
function Dato({ k, v, nombre = true, envolver = false }: { k: string; v: string | null; nombre?: boolean; envolver?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-muted">{k}</dt>
      <dd className={cn('mt-0.5 text-[13.5px]', !envolver && 'truncate', !v && 'text-faint')} title={v ?? undefined}>
        {v ? (nombre ? titulo(v) : v) : 'Sin dato'}
      </dd>
    </div>
  );
}

/** 0.02 -> "<0.1%", 12.34 -> "12.3%" */
const pctCorto = (n: number) => (n > 0 && n < 0.1 ? '<0.1%' : `${fmt1(n)}%`);

export function FichaCampo({
  crop, clp, periodo, onCerrar,
}: {
  crop: CropId;
  clp: string | null;
  periodo: Periodo;
  onCerrar: () => void;
}) {
  const { data: f, isPending } = useFichaCampo(crop, clp, periodo);
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

  const cert = f?.certificacion;
  const usoPct = cert?.capacidad_t && cert.exportado_campana_t !== null ? (cert.exportado_campana_t / cert.capacidad_t) * 100 : null;
  const maxMes = f ? Math.max(1, ...f.mensual) : 1;
  const maxComp = f?.compradores[0]?.share || 1;

  return (
    <Drawer
      abierto={!!clp}
      onCerrar={onCerrar}
      etiqueta="Ficha del campo"
      titulo={f?.predio ? titulo(f.predio) : <span className="num">{clp}</span>}
      subtitulo={
        f && (
          <>
            {f.predio ? <span className="num">CLP {f.clp}</span> : 'Predio sin nombre registrado'}
            {f.productor ? `, ${titulo(f.productor)}` : ''}
          </>
        )
      }
      pie={
        f && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/envios?q=${q(f.clp)}`)}
              className="crop-tint flex-1 rounded-lg bg-crop px-4 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110"
            >
              Ver envíos de este campo
            </button>
            <button onClick={copiar} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-[13.5px] hover:border-faint">
              {copiado ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        )
      }
    >
      {isPending && <div className="flex items-center gap-2 py-10 text-muted"><Loader2 className="size-4 animate-spin" /> Cargando ficha</div>}
      {!isPending && !f && <p className="py-10 text-muted">No encontramos este campo en {crop === 'uva' ? 'uva de mesa' : 'este cultivo'}. Revisa el código o cambia de cultivo.</p>}

      {f && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            {[
              { v: fmt(f.envios), l: 'envíos en el periodo' },
              { v: fmt1(f.t), l: 'toneladas' },
              { v: fmt(f.compradores.length), l: f.compradores.length === 1 ? 'exportador' : 'exportadores' },
              { v: f.ultimo ? `${MESES[f.ultimo.mes - 1]} ${f.ultimo.anio}` : '—', l: 'último envío' },
            ].map((x) => (
              <div key={x.l}>
                <dd className="num font-display text-[22px] leading-none font-semibold">{x.v}</dd>
                <dt className="mt-1 text-[12px] text-muted">{x.l}</dt>
              </div>
            ))}
          </dl>

          <Seccion titulo="Ubicación">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Dato k="Región" v={f.ubicacion.region} />
              <Dato k="Provincia" v={f.ubicacion.provincia} />
              <Dato k="Distrito" v={f.ubicacion.distrito} />
              <Dato k="Sector" v={f.ubicacion.sector} />
              <div className="col-span-2"><Dato k="Dirección" v={f.ubicacion.direccion} envolver /></div>
            </dl>
            {f.ubicacion.fuente === 'envios' && (
              <p className="mt-3 text-[12.5px] text-muted">La región se estimó a partir del origen de sus envíos; este campo no tiene dirección certificada cargada.</p>
            )}
            <a
              href={urlMapa(f)}
              target="_blank"
              rel="noreferrer"
              className="crop-tint mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-crop hover:underline"
            >
              {f.gps ? 'Abrir coordenadas en Google Maps' : 'Buscar la ubicación en Google Maps'}
              <ExternalLink className="size-3.5" />
            </a>
          </Seccion>

          <Seccion
            titulo="Capacidad de la campaña"
            detalle={cert ? 'Área certificada por rendimiento, frente a lo que ya se exportó.' : undefined}
          >
            {cert && cert.capacidad_t ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Dato k="Área certificada" v={cert.area_ha !== null ? `${fmt1(cert.area_ha)} ha` : null} nombre={false} />
                  <Dato k="Rendimiento" v={cert.rend_t_ha !== null ? `${fmt1(cert.rend_t_ha)} t/ha` : null} nombre={false} />
                  <Dato k="Capacidad" v={`${fmt(cert.capacidad_t)} t`} nombre={false} />
                </div>
                {usoPct !== null && (
                  <div className="mt-4 rounded-xl bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span>Exportado: <b className="num">{fmt1(cert.exportado_campana_t!)} t</b></span>
                      <span>Disponible: <b className="num">{fmt1(Math.max(cert.capacidad_t - cert.exportado_campana_t!, 0))} t</b></span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
                      <div className={cn('h-full rounded-full', colorUso(usoPct))} style={{ width: `${Math.min(usoPct, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[12.5px] text-muted">{fmt1(usoPct)}% de la capacidad de la campaña ya se exportó.</p>
                  </div>
                )}
                {cert.variedades.length > 0 && (
                  <p className="mt-3 text-[12.5px] text-muted">
                    Variedades certificadas: {cert.variedades.map((v) => `${titulo(v.v)}${v.ha ? ` (${fmt1(v.ha)} ha)` : ''}`).join(', ')}.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-muted">Este campo no tiene área ni rendimiento certificados, así que todavía no podemos calcular cuánta fruta le queda disponible.</p>
            )}
          </Seccion>

          {f.compradores.length > 0 && (
            <Seccion titulo="A quién le vende" detalle="Parte de lo que sale del campo que se lleva cada exportador. Elige uno para ver su ficha.">
              <ul className="space-y-2">
                {f.compradores.slice(0, 10).map((c) => (
                  <li key={c.n}>
                    <button
                      onClick={() => navigate(`/envios?exportador=${q(c.n)}&ficha=${q(c.n)}`)}
                      className="w-full rounded-md text-left hover:text-crop"
                    >
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="truncate">{titulo(c.n)}</span>
                        <span className="num shrink-0 text-muted">{pctCorto(c.share)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface">
                        <div className="crop-tint h-full rounded-full bg-crop" style={{ width: `${(c.share / maxComp) * 100}%` }} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {f.compradores.length > 10 && <p className="mt-2 text-[12.5px] text-muted">Y {f.compradores.length - 10} exportadores más con menor participación.</p>}
            </Seccion>
          )}

          {f.envios > 0 && (
            <>
              <Seccion titulo="Cuándo sale su fruta" detalle="Toneladas por mes en el periodo elegido.">
                <div className="flex h-20 items-end gap-1">
                  {f.mensual.map((kg, i) => (
                    <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${MESES_LARGO[i]}: ${fmt1(kg / 1000)} t`}>
                      <div className="crop-tint rounded-t-[3px] bg-crop" style={{ height: `${(kg / maxMes) * 100}%`, minHeight: kg ? 3 : 0, opacity: kg ? 1 : 0 }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex gap-1">
                  {MESES.map((m) => <span key={m} className="flex-1 text-center text-[10.5px] text-muted">{m.charAt(0)}</span>)}
                </div>
              </Seccion>

              <Seccion titulo="A dónde llega">
                <ul className="space-y-1.5">
                  {f.destinos.map((d) => (
                    <li key={d.n} className="flex justify-between gap-3 text-[13px]">
                      <span className="truncate">{titulo(d.n)}</span>
                      <span className="num shrink-0 text-muted">{fmt1(d.kg / 1000)} t</span>
                    </li>
                  ))}
                </ul>
              </Seccion>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}