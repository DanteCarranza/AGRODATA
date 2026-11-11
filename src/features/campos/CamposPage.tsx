import { useCallback, useMemo, useState } from 'react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { Skeleton } from '@/components/ui/Panel';
import { fmt } from '@/lib/format';
import { useCampos } from './useCampos';
import { useFiltrosCampos } from './useFiltrosCampos';
import { exportarCampos } from './exportar';
import { ResumenCampos } from './components/ResumenCampos';
import { BarraFiltrosCampos } from './components/BarraFiltrosCampos';
import { TablaCampos } from './components/TablaCampos';
import { FichaCampo } from './components/FichaCampo';

export default function CamposPage() {
  const { crop, anio, mesIni, mesFin } = useFiltros();
  const { filtros, campo, set, ordenarPor, limpiar, activos } = useFiltrosCampos();
  const periodo = useMemo(() => ({ anio, mesIni, mesFin }), [anio, mesIni, mesFin]);
  const params = { crop, ...periodo, ...filtros };

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isPlaceholderData } =
    useCampos(params);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const primera = data?.pages[0];
  const filas = useMemo(() => data?.pages.flatMap((p) => p.filas) ?? [], [data]);
  const cargarMas = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const abrir = useCallback((clp: string) => set({ campo: clp }), [set]);
  const cerrar = useCallback(() => set({ campo: null }), [set]);

  const exportar = async () => {
    setExportando(true);
    setErrorExport(null);
    try {
      await exportarCampos(params);
    } catch (e) {
      setErrorExport((e as Error).message);
    } finally {
      setExportando(false);
    }
  };

  const r = primera?.resumen;
  const stats = primera && r
    ? [
        { v: fmt(primera.total), l: primera.total === 1 ? 'campo con envíos' : 'campos con envíos' },
        { v: fmt(r.t), l: 'toneladas' },
        { v: fmt(r.regiones.filter((x) => x.n !== 'Sin región').length), l: 'regiones' },
        { v: fmt(r.compradores.muchos), l: 'venden a 4 o más' },
      ]
    : null;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="max-w-xl">
          <h1 className="font-display text-[36px] leading-none font-semibold tracking-[-0.025em]">Campos</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {cropById(crop).nombre}, {resumenPeriodo(anio, mesIni, mesFin).toLowerCase()}. Lugares de producción certificados
            que enviaron fruta: dónde están, a quién le venden y cuánta capacidad les queda.
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
          <ResumenCampos
            resumen={r}
            region={filtros.region}
            compradores={filtros.compradores}
            onRegion={(x) => set({ region: x })}
            onCompradores={(x) => set({ compradores: x })}
          />
        ) : (
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        )}
      </div>

      <div className="mt-5">
        <BarraFiltrosCampos
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
            <p className="font-medium">No se pudo cargar la lista de campos</p>
            <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
            <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
          </div>
        ) : isPending ? (
          <Skeleton className="h-[calc(100dvh-250px)] min-h-[480px] w-full rounded-2xl" />
        ) : filas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper px-6 py-16 text-center">
            <p className="font-medium">Ningún campo cumple estos filtros</p>
            <p className="mt-1 text-[13px] text-muted">Quita algún filtro o amplía el periodo en la barra superior.</p>
            {activos && (
              <button onClick={limpiar} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] font-medium text-white">
                Quitar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <TablaCampos
            filas={filas}
            total={primera?.total ?? 0}
            filtros={filtros}
            seleccionado={campo}
            hayMas={!!hasNextPage}
            cargandoMas={isFetchingNextPage}
            onCargarMas={cargarMas}
            onOrdenar={ordenarPor}
            onAbrir={abrir}
          />
        )}
      </div>

      <FichaCampo crop={crop} clp={campo} periodo={periodo} onCerrar={cerrar} />
    </div>
  );
}