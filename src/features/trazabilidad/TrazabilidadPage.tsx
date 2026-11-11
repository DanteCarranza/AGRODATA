import { useCallback, useMemo, useRef } from 'react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { Panel, Skeleton } from '@/components/ui/Panel';
import { cn } from '@/lib/format';
import type { Eslabon } from '@/types/agro';
import { useCadena, useFoco, useTrazabilidad } from './useTrazabilidad';
import { HeroTraza } from './components/HeroTraza';
import { Rastreador } from './components/Rastreador';
import { FlujoSankey } from './components/FlujoSankey';
import { TablaTrazaExportadores } from './components/TablaTrazaExportadores';

export default function TrazabilidadPage() {
  const { crop, anio, mesIni, mesFin } = useFiltros();
  const periodo = useMemo(() => ({ anio, mesIni, mesFin }), [anio, mesIni, mesFin]);
  const cultivo = cropById(crop).nombre;
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTrazabilidad({ crop, ...periodo });

  // Sin eslabón en la URL, el rastreador arranca con el primer sugerido (el importador que más compra)
  const { foco, setFoco } = useFoco();
  const sugerido = data?.sugeridos[0];
  const efectivo = foco ?? (sugerido ? { tipo: sugerido.tipo, n: sugerido.n } : null);
  const cadena = useCadena(crop, periodo, efectivo);

  const rastreadorRef = useRef<HTMLDivElement>(null);
  const elegir = useCallback(
    (tipo: Eslabon, n: string) => {
      setFoco({ tipo, n });
      const el = rastreadorRef.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setFoco],
  );
  const elegirLejos = useCallback(
    (tipo: Eslabon, n: string) => {
      setFoco({ tipo, n });
      rastreadorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setFoco],
  );

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo cargar la trazabilidad</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-[13px] text-muted">Trazabilidad · {cultivo}, {resumenPeriodo(anio, mesIni, mesFin).toLowerCase()}</p>
        <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
          Del campo <span className="crop-tint text-crop">al destino</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          Cada envío declara los campos certificados de donde salió su fruta. Aquí se unen campo, planta, exportador, importador y
          país, enlazados por el código de lugar de producción.
        </p>
      </header>

      <div className={cn('mt-7 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data ? <HeroTraza data={data} anio={anio} cultivo={cultivo} /> : <Skeleton className="h-[400px] w-full rounded-3xl" />}
      </div>

      <div ref={rastreadorRef} className="mt-6 scroll-mt-24">
        <Rastreador
          crop={crop}
          cadena={cadena.data}
          cargando={cadena.isFetching || (!data && isPending)}
          sugeridos={data?.sugeridos ?? []}
          onElegir={elegir}
        />
      </div>

      <Panel
        className={cn('mt-6 transition-opacity', isPlaceholderData && 'opacity-60')}
        titulo="Por dónde viaja la fruta"
        detalle="Toneladas respaldadas por campo, desde la región de origen hasta el país de destino. Pasa el cursor por un nombre para ver su recorrido; toca un destino para seguirlo en la cadena."
      >
        {data ? <FlujoSankey flujo={data.flujo} onElegir={elegirLejos} /> : <Skeleton className="h-[460px] w-full" />}
      </Panel>

      <div className={cn('mt-6 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data ? <TablaTrazaExportadores filas={data.exportadores} onElegir={elegirLejos} /> : <Skeleton className="h-[520px] w-full rounded-2xl" />}
      </div>
    </div>
  );
}