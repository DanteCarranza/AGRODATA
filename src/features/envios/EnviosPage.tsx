import { useCallback, useMemo, useState } from 'react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { Skeleton } from '@/components/ui/Panel';
import { fmt } from '@/lib/format';
import { useEnvios } from './useEnvios';
import { useFiltrosEnvios } from './useFiltrosEnvios';
import { exportarEnvios } from './exportar';
import { BarraFiltros } from './components/BarraFiltros';
import { HojaEnvios } from './components/HojaEnvios';
import { ResumenEnvios } from './components/ResumenEnvios';
import { FichaExportador } from './components/FichaExportador';
import { DetalleEnvio } from './components/DetalleEnvio';

export default function EnviosPage() {
  const { crop, anio, mesIni, mesFin } = useFiltros();
  const { filtros, ficha, envio, set, ordenarPor, limpiar, activos } = useFiltrosEnvios();
  const periodo = useMemo(() => ({ anio, mesIni, mesFin }), [anio, mesIni, mesFin]);
  const params = { crop, ...periodo, ...filtros };

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isPlaceholderData } =
    useEnvios(params);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const primera = data?.pages[0];
  const filas = useMemo(() => data?.pages.flatMap((p) => p.filas) ?? [], [data]);
  const cargarMas = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  const exportar = async () => {
    setExportando(true);
    setErrorExport(null);
    try {
      await exportarEnvios(params);
    } catch (e) {
      setErrorExport((e as Error).message);
    } finally {
      setExportando(false);
    }
  };

  const abrirDetalle = useCallback((id: string) => set({ envio: id, ficha: null }), [set]);
  const abrirFicha = useCallback((x: string) => set({ ficha: x, envio: null }), [set]);
  const cerrarDetalle = useCallback(() => set({ envio: null }), [set]);
  const cerrarFicha = useCallback(() => set({ ficha: null }), [set]);
  const filtrarDesdeDetalle = useCallback(
    (c: Partial<Record<'destino' | 'importador' | 'variedad', string>>) => set({ ...c, envio: null }),
    [set],
  );

  const r = primera?.resumen;
  const stats = primera && r
    ? [
        { v: fmt(primera.total), l: primera.total === 1 ? 'envío' : 'envíos' },
        { v: fmt(r.peso_kg / 1000), l: 'toneladas embarcadas' },
        { v: fmt(r.exportadores), l: r.exportadores === 1 ? 'exportador' : 'exportadores' },
        { v: fmt(r.importadores), l: r.importadores === 1 ? 'importador' : 'importadores' },
      ]
    : null;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="max-w-xl">
          <h1 className="font-display text-[36px] leading-none font-semibold tracking-[-0.025em]">Envíos</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {cropById(crop).nombre}, {resumenPeriodo(anio, mesIni, mesFin).toLowerCase()}. Cada fila es un certificado de
            exportación: de qué campos salió la fruta, quién la compró y a dónde fue.
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          {(stats ?? Array.from({ length: 4 }, () => null)).map((s, i) => (
            <div key={i}>
              {s ? (
                <>
                  <dd className="num font-display text-[22px] leading-none font-semibold">{s.v}</dd>
                  <dt className="mt-1 text-[12.5px] text-muted">{s.l}</dt>
                </>
              ) : (
                <><Skeleton className="h-6 w-16" /><Skeleton className="mt-1.5 h-3 w-20" /></>
              )}
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-6">
        {r ? (
          <ResumenEnvios resumen={r} traza={filtros.traza} onTraza={(t) => set({ traza: t })} />
        ) : (
          <Skeleton className="h-[150px] w-full rounded-2xl" />
        )}
      </div>

      <div className="mt-5">
        <BarraFiltros
          filtros={filtros}
          facetas={primera?.facetas}
          activos={activos}
          exportando={exportando}
          onCambio={set}
          onLimpiar={limpiar}
          onExportar={exportar}
        />
        {errorExport && <p className="mt-2 text-[13px] text-bad">{errorExport}. Vuelve a intentarlo en unos segundos.</p>}
      </div>

      <div className={`mt-4 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        {isError ? (
          <div className="rounded-2xl border border-bad/30 bg-paper p-6">
            <p className="font-medium">No se pudo cargar la hoja de envíos</p>
            <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
            <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
          </div>
        ) : isPending ? (
          <Skeleton className="h-[calc(100dvh-250px)] min-h-[480px] w-full rounded-2xl" />
        ) : filas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper px-6 py-16 text-center">
            <p className="font-medium">Ningún envío cumple estos filtros</p>
            <p className="mt-1 text-[13px] text-muted">Quita algún filtro o amplía el periodo en la barra superior.</p>
            {activos && (
              <button onClick={limpiar} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] font-medium text-white">
                Quitar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <HojaEnvios
            filas={filas}
            total={primera?.total ?? 0}
            filtros={filtros}
            seleccionado={envio}
            hayMas={!!hasNextPage}
            cargandoMas={isFetchingNextPage}
            onCargarMas={cargarMas}
            onOrdenar={ordenarPor}
            onDetalle={abrirDetalle}
            onFicha={abrirFicha}
            onFiltro={set}
          />
        )}
      </div>

      <DetalleEnvio crop={crop} id={envio} onCerrar={cerrarDetalle} onFicha={abrirFicha} onFiltro={filtrarDesdeDetalle} />

      <FichaExportador
        crop={crop}
        nombre={ficha}
        periodo={periodo}
        onCerrar={cerrarFicha}
        onVerEnvios={(x) => set({ exportador: x, ficha: null })}
        onImportador={(x, imp) => set({ exportador: x, importador: imp, ficha: null })}
      />
    </div>
  );
}