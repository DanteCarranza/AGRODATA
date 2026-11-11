import { Link } from 'react-router-dom';
import { ChevronRight, PackageOpen, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { BalanceCampo, BalanceData } from '@/types/agro';
import { cn, fmt, titulo } from '@/lib/format';
import { ESTADO_SALDO } from '../estado';

const enlaceCampo = (clp: string) => `/campos?campo=${encodeURIComponent(clp)}`;

function Identidad({ f }: { f: BalanceCampo }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[13.5px] font-medium group-hover:text-crop-ink">{f.predio ? titulo(f.predio) : titulo(f.productor ?? f.clp)}</div>
      <div className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted">
        <span className="num rounded bg-surface px-1.5 py-px text-[11px]">{f.clp}</span>
        {f.region && <span className="truncate">{titulo(f.region)}</span>}
        {f.variedades[0] && <span className="truncate">· {titulo(f.variedades[0].v)}</span>}
      </div>
    </div>
  );
}

/** Dónde hay saldo para ofrecer (comercial) y qué certificados requieren revisión (compliance) */
export function AlertasBalance({ data }: { data: BalanceData }) {
  const maxSaldo = Math.max(1, ...data.oportunidades.map((f) => f.saldo_t));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
           <section className="min-w-0 rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center gap-3">
          <span className="crop-tint grid size-9 place-items-center rounded-xl bg-crop-soft text-crop">
            <PackageOpen className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-[16px] font-semibold tracking-tight">Dónde queda fruta certificada</h2>
            <p className="text-[12.5px] text-muted">Campos con más saldo sin embarcar: proveedores posibles para compradores nuevos.</p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {data.oportunidades.map((f) => (
            <li key={f.clp}>
              <Link to={enlaceCampo(f.clp)} className="group flex items-center gap-4 py-2.5">
                <Identidad f={f} />
                <div className="ml-auto w-36 shrink-0 text-right">
                  <div className="num font-display text-[16px] leading-none font-semibold">{fmt(f.saldo_t)} t</div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                    <div className="crop-tint ml-auto h-full rounded-full bg-crop" style={{ width: `${(f.saldo_t / maxSaldo) * 100}%` }} />
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-line group-hover:text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-faint">Saldo de la campaña {data.campana}. Confirma que el certificado siga vigente antes de ofertar.</p>
      </section>

      <section className="min-w-0 rounded-2xl border border-line bg-paper p-5">
        {data.alertas.length ? (
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-bad/10 text-bad">
                <ShieldAlert className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-[16px] font-semibold tracking-tight">Certificados por revisar</h2>
                <p className="text-[12.5px] text-muted">Sobregiros y certificados que ya usaron el 90% o más.</p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {data.alertas.slice(0, 6).map((f) => {
                const e = ESTADO_SALDO[f.estado];
                return (
                  <li key={f.clp}>
                    <Link to={enlaceCampo(f.clp)} className="group flex items-center gap-4 py-2.5">
                      <Identidad f={f} />
                      <span className={cn('ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium', e.fondo, e.texto)}>
                        {e.titulo} · {Math.round(f.uso_pct)}%
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-line group-hover:text-muted" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-ok/10 text-ok">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-[16px] font-semibold tracking-tight">Ningún campo supera lo certificado</h2>
                <p className="text-[12.5px] text-muted">Campaña {data.campana}: todos embarcaron menos de lo que su certificado permite.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-surface p-4 text-[13px] leading-relaxed text-muted">
              Un <b className="font-medium text-ink">sobregiro</b> ocurre cuando lo embarcado bajo un código supera su saldo certificado. Puede
              ser un error en la emisión (rendimiento inflado) o fruta exportada con un código que no le corresponde (infracción de
              origen). Si aparece uno, lo verás aquí y en el semáforo de arriba.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}