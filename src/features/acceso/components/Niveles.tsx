import type { ReactNode } from 'react';
import { AlertTriangle, BadgeCheck, ExternalLink, FileCheck2, FlaskConical, ScrollText, type LucideIcon } from 'lucide-react';
import type { AccesoData, Requisito } from '@/types/agro';
import { FUENTES } from '@/config/fuentes';
import { nombrePais } from '@/lib/paises';
import { cn } from '@/lib/format';
import { MESES } from '@/config/crops';

const fecha = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1].toLowerCase()} ${a}`;
};

/** Sello que dice de dónde sale cada requisito y si ya está confirmado */
function Estado({ r }: { r: Requisito }) {
  if (r.estado === 'verificado') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2.5 py-1 text-[12px] font-medium text-ok">
        <BadgeCheck className="size-3.5" aria-hidden />
        Verificado{r.verificado ? ` el ${fecha(r.verificado)}` : ''} · {r.fuente}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2.5 py-1 text-[12px] font-medium text-warn">
      <AlertTriangle className="size-3.5" aria-hidden />
      Referencial, sin verificar
    </span>
  );
}

function Nivel({
  n, titulo, etiqueta, tono, icono: Icono, detalle, ultimo, children,
}: {
  n: number;
  titulo: string;
  etiqueta: string;
  tono: 'bad' | 'warn' | 'ok';
  icono: LucideIcon;
  detalle: string;
  ultimo?: boolean;
  children: ReactNode;
}) {
  const color = { bad: 'bg-bad text-white', warn: 'bg-warn text-white', ok: 'bg-ok text-white' }[tono];
  const suave = { bad: 'bg-bad/10 text-bad', warn: 'bg-warn/10 text-warn', ok: 'bg-ok/10 text-ok' }[tono];
  return (
    <li className="relative grid grid-cols-[40px_1fr] gap-4 sm:grid-cols-[48px_1fr] sm:gap-5">
      {!ultimo && <span aria-hidden className="absolute top-12 bottom-[-20px] left-5 w-px bg-line sm:left-6" />}
      <span className={cn('relative grid size-10 place-items-center rounded-2xl font-display text-[17px] font-semibold sm:size-12', color)}>{n}</span>
      <section className="min-w-0 rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Icono className="size-5 text-muted" aria-hidden />
          <h2 className="font-display text-[18px] font-semibold tracking-tight">{titulo}</h2>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', suave)}>{etiqueta}</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">{detalle}</p>
        <div className="mt-4">{children}</div>
      </section>
    </li>
  );
}

function Lista({ items, vacio }: { items: string[]; vacio: string }) {
  if (!items.length) return <p className="text-[13.5px] text-muted">{vacio}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-[13.5px]">
          <span className="crop-tint mt-[7px] size-1.5 shrink-0 rounded-full bg-crop" aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Dato({ k, children, ancho }: { k: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={cn('rounded-xl bg-surface/70 p-4', ancho && 'sm:col-span-2')}>
      <div className="text-[12px] text-muted">{k}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const Consulta = ({ href, texto }: { href: string; texto: string }) => (
  <a href={href} target="_blank" rel="noreferrer" className="crop-tint inline-flex items-center gap-1.5 text-[13px] font-medium text-crop hover:underline">
    {texto} <ExternalLink className="size-3.5" aria-hidden />
  </a>
);

/** Los tres niveles de requisitos, del obligatorio al que depende del mercado */
export function Niveles({ data, cultivo }: { data: AccesoData; cultivo: string }) {
  const f = data.fitosanitario;
  const mercado = data.rige ? nombrePais(data.rige) : nombrePais(data.destino);

  return (
    <ol className="space-y-5">
      <Nivel
        n={1}
        titulo="Fitosanitario"
        etiqueta="Obligatorio"
        tono="bad"
        icono={FileCheck2}
        detalle="Sin esto la fruta no entra. Aplica a todos los envíos."
      >
        {f ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Estado r={f} />
              <Consulta href={FUENTES.requisitosExportacion} texto="Confirmar en SENASA" />
            </div>
            {f.estado === 'referencial' && (
              <p className="mb-4 rounded-xl bg-warn/5 p-3 text-[12.5px] leading-relaxed text-muted ring-1 ring-warn/20">
                Estos requisitos vienen del prototipo como ejemplo y todavía no se cruzan con la consulta oficial. Úsalos para ubicarte,
                no para preparar un envío.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Dato k="Certificado fitosanitario">
                <span className={cn('text-[14px] font-semibold', f.certificado ? 'text-bad' : 'text-muted')}>{f.certificado ? 'Obligatorio' : 'No requiere'}</span>
                {f.categoria !== null && <span className="ml-2 text-[13px] text-muted">Categoría de riesgo {f.categoria}</span>}
              </Dato>
              <Dato k="Inspección">
                <span className="text-[13.5px]">{f.inspeccion ?? 'Sin dato'}</span>
              </Dato>
              <Dato k="Tratamientos cuarentenarios">
                <Lista items={f.tratamientos} vacio="Ninguno específico" />
              </Dato>
              <Dato k="Declaraciones adicionales">
                <Lista items={f.declaraciones} vacio="Ninguna" />
              </Dato>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-5 text-[13.5px] text-muted">
            Todavía no tenemos los requisitos de {cultivo.toLowerCase()} para {mercado}. Mientras tanto, revísalos en la consulta oficial.
            <div className="mt-3"><Consulta href={FUENTES.requisitosExportacion} texto="Consulta oficial de SENASA" /></div>
          </div>
        )}
      </Nivel>

      <Nivel
        n={2}
        titulo="Límites máximos de residuos"
        etiqueta="Por muestreo"
        tono="warn"
        icono={FlaskConical}
        detalle="El mercado revisa al azar si los residuos de plaguicidas están bajo su límite. Puede tocarle a tu contenedor o no."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Dato k="Norma que aplica">
            <span className="text-[14px] font-semibold">{data.lmr.norma}</span>
          </Dato>
          <Dato k="Dónde consultarla">
            <Consulta href={FUENTES.lmr} texto="Límites máximos en SENASA" />
          </Dato>
        </div>
        {data.lmr.analitos.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-muted">
                  <th className="py-2 font-normal">Plaguicida</th>
                  <th className="py-2 text-right font-normal">Límite en {mercado}</th>
                  <th className="py-2 text-right font-normal">Codex</th>
                </tr>
              </thead>
              <tbody>
                {data.lmr.analitos.map((a) => {
                  const masEstricto = a.codex !== null && a.limite < a.codex;
                  return (
                    <tr key={a.analito} className="border-b border-line last:border-0">
                      <td className="py-2">{a.analito}</td>
                      <td className={cn('num py-2 text-right font-medium', masEstricto && 'text-bad')}>{a.limite} {a.unidad}</td>
                      <td className="num py-2 text-right text-muted">{a.codex ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-[12px] text-muted">En rojo, los límites más estrictos que el Codex.</p>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-muted">
            Próximamente: el límite de cada plaguicida en {mercado} frente al Codex, marcando dónde este mercado es más estricto.
          </p>
        )}
      </Nivel>

      <Nivel
        n={3}
        titulo="Otros requisitos"
        etiqueta="Según el mercado"
        tono="ok"
        icono={ScrollText}
        detalle="Registros y trámites propios de cada país, aparte de lo fitosanitario."
        ultimo
      >
        {data.otros.length ? (
          <ul className="space-y-3">
            {data.otros.map((o) => (
              <li key={o.texto} className="rounded-xl bg-surface/70 p-4">
                <p className="text-[13.5px]">{o.texto}</p>
                <div className="mt-2"><Estado r={o} /></div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13.5px] text-muted">No tenemos requisitos adicionales registrados para {mercado}.</p>
        )}
      </Nivel>

    </ol>
  );
}