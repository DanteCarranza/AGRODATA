import { useCallback, useMemo, useState } from 'react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { Skeleton } from '@/components/ui/Panel';
import { FiltrosLista } from '@/components/ui/FiltrosLista';
import { cn, fmt } from '@/lib/format';
import { useImportadores } from './useImportadores';
import { useFiltrosImportadores } from './useFiltrosImportadores';
import { exportarImportadores } from './exportar';
import { PodioImportadores } from './components/PodioImportadores';
import { ResumenImportadores } from './components/ResumenImportadores';
import { TablaImportadores } from './components/TablaImportadores';
import { FichaImportador } from './components/FichaImportador';

export default function ImportadoresPage() {
  const { crop, anio, mesIni, mesFin } = useFiltros();
  const { filtros, importador, set, ordenarPor, limpiar, activos } = useFiltrosImportadores();
  const periodo = useMemo(() => ({ anio, mesIni, mesFin }), [anio, mesIni, mesFin]);
  const params = { crop, ...periodo, ...filtros };
  const cultivo = cropById(crop).nombre;

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isPlaceholderData } =
    useImportadores(params);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const primera = data?.pages[0];
  const filas = useMemo(() => data?.pages.flatMap((p) => p.filas) ?? [], [data]);
  const cargarMas = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const abrir = useCallback((n: string) => set({ importador: n }), [set]);
  const cerrar = useCallback(() => set({ importador: null }), [set]);

  const exportar = async () => {
    setExportando(true);
    setErrorExport(null);
    try {
      await exportarImportadores(params);
    } catch (e) {
      setErrorExport((e as Error).message);
    } finally {
      setExportando(false);
    }
  };

  const r = primera?.resumen;
  const stats = primera && r
    ? [
        { v: fmt(primera.total), l: primera.total === 1 ? 'importador' : 'importadores' },
        { v: fmt(r.t), l: 'toneladas compradas' },
        { v: fmt(r.paises.length), l: r.paises.length === 1 ? 'país' : 'países' },
        // con un filtro de tendencia activo esta cifra contradiría la lista, así que se oculta
        ...(filtros.tendencia ? [] : [{ v: fmt(r.tendencias.crece + r.tendencias.nuevo), l: 'crecen o son nuevos' }]),
      ]
    : null;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-2xl">
          <p className="text-[13px] text-muted">{cultivo}, {resumenPeriodo(anio, mesIni, mesFin).toLowerCase()}</p>
          <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
            Ranking de <span className="crop-tint text-crop">importadores</span>
          </h1>
          <p className="mt-3 text-[14px] text-muted">
            Quién compra fruta peruana, qué variedad pide, en qué meses, y qué campos podrían abastecerlo.
          </p>
        </div>
        <dl className="grid w-full grid-cols-2 gap-y-5 sm:flex sm:w-auto sm:flex-wrap">
          {(stats ?? Array.from({ length: 4 }, () => null)).map((s, i) => (
            <div key={i} className={cn('pr-6', i % 2 === 1 && 'border-l border-line pl-5', i > 0 && 'sm:border-l sm:border-line sm:pl-6')}>
              {s ? (
                <>
                  <dd className="num font-display text-[26px] leading-none font-semibold tracking-tight">{s.v}</dd>
                  <dt className="mt-1.5 text-[12.5px] text-muted">{s.l}</dt>
                </>
              ) : (
                <><Skeleton className="h-6 w-16" /><Skeleton className="mt-1.5 h-3 w-20" /></>
              )}
            </div>
          ))}
        </dl>
      </header>

      <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
        <div className="mt-7">
          {primera ? (
            primera.resumen.top.length > 0 && <PodioImportadores pagina={primera} cultivo={cultivo} onAbrir={abrir} />
          ) : (
            <Skeleton className="h-[330px] w-full rounded-3xl" />
          )}
        </div>

        <div className="mt-5">
          {primera ? (
            <ResumenImportadores
              pagina={primera}
              pais={filtros.pais}
              tendencia={filtros.tendencia}
              onPais={(x) => set({ pais: x })}
              onTendencia={(x) => set({ tendencia: x })}
            />
          ) : (
            <Skeleton className="h-[340px] w-full rounded-2xl" />
          )}
        </div>
      </div>

      <div className="mt-10 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">Todos los importadores</h2>
        {primera && <span className="num text-[13px] text-muted">{fmt(primera.total)} en la lista</span>}
      </div>

      <div className="mt-3">
        <FiltrosLista
          q={filtros.q}
          placeholder="Nombre del importador"
          onQ={(v) => set({ q: v })}
          selectores={[
            { etiqueta: 'País', todos: 'Todos los países', valor: filtros.pais, opciones: primera?.facetas.paises ?? [], onCambio: (v) => set({ pais: v }) },
            { etiqueta: 'Variedad', todos: 'Todas las variedades', valor: filtros.variedad, opciones: primera?.facetas.variedades ?? [], onCambio: (v) => set({ variedad: v }) },
          ]}
          activos={activos}
          onLimpiar={limpiar}
          exportando={exportando}
          onExportar={exportar}
        />
        {errorExport && <p className="mt-2 text-[13px] text-bad">{errorExport}. Vuelve a intentarlo en unos segundos.</p>}
      </div>

      <div className={cn('mt-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {isError ? (
          <div className="rounded-2xl border border-bad/30 bg-paper p-6">
            <p className="font-medium">No se pudo cargar el ranking</p>
            <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
            <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
          </div>
        ) : isPending ? (
          <Skeleton className="h-[calc(100dvh-220px)] min-h-[520px] w-full rounded-2xl" />
        ) : filas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper px-6 py-16 text-center">
            <p className="font-medium">Ningún importador cumple estos filtros</p>
            <p className="mt-1 text-[13px] text-muted">Quita algún filtro o amplía el periodo en la barra superior.</p>
            {activos && (
              <button onClick={limpiar} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] font-medium text-white">
                Quitar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <TablaImportadores
            filas={filas}
            total={primera?.total ?? 0}
            filtros={filtros}
            seleccionado={importador}
            hayMas={!!hasNextPage}
            cargandoMas={isFetchingNextPage}
            onCargarMas={cargarMas}
            onOrdenar={ordenarPor}
            onAbrir={abrir}
          />
        )}
      </div>

      <FichaImportador crop={crop} nombre={importador} periodo={periodo} onCerrar={cerrar} />
    </div>
  );
}