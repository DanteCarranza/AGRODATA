import { useState } from 'react';
import { Scale } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import { FiltrosLista } from '@/components/ui/FiltrosLista';
import { aCsv, descargar } from '@/lib/csv';
import { cn, fmt } from '@/lib/format';
import type { OrdenBalance } from '@/types/agro';
import { useBalance, useFiltrosBalance } from './useBalance';
import { ESTADO_SALDO } from './estado';
import { HeroBalance } from './components/HeroBalance';
import { AlertasBalance } from './components/AlertasBalance';
import { ListaBalance } from './components/ListaBalance';

const ORDENES: { k: OrdenBalance; l: string }[] = [
  { k: 'saldo', l: 'Más saldo' },
  { k: 'uso', l: 'Más usados' },
  { k: 'certificado', l: 'Más certificado' },
];

export default function BalancePage() {
  const { crop, setCrop } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const { filtros, set, limpiar, activos } = useFiltrosBalance();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useBalance({ crop, ...filtros });
  const [exportando, setExportando] = useState(false);

  const exportar = () => {
    if (!data) return;
    setExportando(true);
    descargar(
      aCsv(
        ['Código', 'Predio', 'Productor', 'Región', 'Variedades', 'Área (ha)', 'Rendimiento (t/ha)', 'Certificado (t)', 'Embarcado (t)', 'Saldo (t)', 'Uso (%)', 'Estado', 'Inicio vigencia', 'Fin vigencia'],
        data.filas.map((f) => [
          f.clp, f.predio, f.productor, f.region, f.variedades.map((v) => v.v).join(' / '), f.area_ha, f.rend_t_ha,
          Math.round(f.certificado_t), Math.round(f.embarcado_t * 10) / 10, Math.round(f.saldo_t), Math.round(f.uso_pct * 10) / 10,
          ESTADO_SALDO[f.estado].titulo, f.vigencia?.ini ?? null, f.vigencia?.fin ?? null,
        ]),
      ),
      `balance_${crop}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    setExportando(false);
  };

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo cargar el balance</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  const encabezado = (
    <header className="max-w-3xl">
      <p className="text-[13px] text-muted">
        Balance y compliance · {cultivo}{data?.campana ? `, campaña ${data.campana}` : ''}
      </p>
      <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
        Saldo de cada <span className="crop-tint text-crop">certificado</span>
      </h1>
      <p className="mt-3 text-[14px] text-muted">
        Cuánto certificó producir cada campo frente a cuánto ya embarcó. El saldo es fruta que todavía puede salir con ese código;
        un sobregiro es una alerta de origen. Se calcula por campaña, así que el filtro de periodo no aplica aquí.
      </p>
    </header>
  );

  if (data && !data.disponible) {
    return (
      <div>
        {encabezado}
        <div className="mt-7 rounded-3xl border border-line bg-paper px-6 py-16 text-center">
          <span className="crop-tint mx-auto grid size-14 place-items-center rounded-2xl bg-crop-soft text-crop">
            <Scale className="size-7" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-[22px] font-semibold tracking-tight">El balance de {cultivo.toLowerCase()} llega con sus certificados</h2>
          <p className="mx-auto mt-2 max-w-lg text-[14px] text-muted">
            Para calcular el saldo necesitamos el área y el rendimiento certificados de cada campo. En esta muestra solo uva los
            tiene; la misma lógica se aplica a {cultivo.toLowerCase()} en cuanto carguemos sus certificados.
          </p>
          <button onClick={() => setCrop('uva')} className="crop-tint mt-6 rounded-lg bg-crop px-5 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110">
            Ver el balance de uva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {encabezado}

      <div className={cn('mt-7 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data ? (
          <HeroBalance data={data} cultivo={cultivo} estado={filtros.estado} onEstado={(e) => set({ estado: e })} />
        ) : (
          <Skeleton className="h-[380px] w-full rounded-3xl" />
        )}
      </div>

      <div className={cn('mt-5 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data ? <AlertasBalance data={data} /> : <Skeleton className="h-[320px] w-full rounded-2xl" />}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight">Todos los certificados</h2>
          {data && (
            <p className="num text-[13px] text-muted">
              {fmt(data.filas.length)} {data.filas.length === 1 ? 'campo' : 'campos'}
              {filtros.estado && <> en estado “{ESTADO_SALDO[filtros.estado].titulo.toLowerCase()}”</>}
            </p>
          )}
        </div>
        <div role="radiogroup" aria-label="Ordenar" className="flex rounded-lg border border-line bg-paper p-0.5 text-[12.5px]">
          {ORDENES.map((o) => (
            <button
              key={o.k}
              role="radio"
              aria-checked={filtros.orden === o.k}
              onClick={() => set({ orden: o.k === 'saldo' ? null : o.k })}
              className={cn('crop-tint rounded-md px-3 py-1.5', filtros.orden === o.k ? 'bg-crop text-white' : 'text-muted hover:text-ink')}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <FiltrosLista
          q={filtros.q}
          placeholder="Código, predio, productor o variedad"
          onQ={(v) => set({ q: v })}
          selectores={[
            { etiqueta: 'Región', todos: 'Todas las regiones', valor: filtros.region, opciones: data?.regiones ?? [], onCambio: (v) => set({ region: v }) },
          ]}
          activos={activos}
          onLimpiar={limpiar}
          exportando={exportando}
          onExportar={exportar}
        />
      </div>

      <div className={cn('mt-4 overflow-hidden rounded-2xl border border-line bg-paper transition-opacity', isPlaceholderData && 'opacity-60')}>
        {isPending ? (
          <Skeleton className="h-[600px] w-full" />
        ) : data.filas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">Ningún certificado cumple estos filtros</p>
            <p className="mt-1 text-[13px] text-muted">Quita algún filtro para ver más campos.</p>
            {activos && (
              <button onClick={limpiar} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] font-medium text-white">
                Quitar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <ListaBalance key={JSON.stringify(filtros)} filas={data.filas} />
        )}
      </div>

      <section className="mt-6 rounded-2xl bg-paper/60 p-5 text-[12.5px] leading-relaxed text-muted ring-1 ring-line">
        <h2 className="font-medium text-ink">Cómo se calcula</h2>
        <p className="mt-1">
          El balance es por código individual (XXX-XXXXX-XX completo), nunca agrupando por empresa ni por prefijo: los dos últimos
          dígitos son campos distintos. Lo certificado es el área certificada por el rendimiento declarado; lo embarcado suma solo
          los envíos de ese código en la campaña. Así se evitan falsos positivos contra exportadores que cumplen. El saldo no es
          merma física: el descarte por calidad no aparece en los registros oficiales.
        </p>
      </section>
    </div>
  );
}