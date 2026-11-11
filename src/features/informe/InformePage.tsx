import { useMemo, useState } from 'react';
import { Check, Link2, Printer } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { Skeleton } from '@/components/ui/Panel';
import { useSesion } from '@/features/sesion/useSesion';
import { cn, titulo } from '@/lib/format';
import { puedeDescargar } from '@/lib/acceso';
import { useInforme, useVariedadInforme } from './useInforme';
import { HojaInforme } from './components/HojaInforme';

export default function InformePage() {
  const { crop, anio, mesIni, mesFin } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const periodo = useMemo(() => ({ anio, mesIni, mesFin }), [anio, mesIni, mesFin]);
  const { variedad, setVariedad } = useVariedadInforme();
  const { data, isError, error, refetch, isPlaceholderData } = useInforme({ crop, ...periodo, variedad });
  const { data: sesion } = useSesion();
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

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo generar el informe</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] text-muted">Informe visual · {cultivo}</p>
            <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
              Un resumen para <span className="crop-tint text-crop">compartir</span>
            </h1>
            <p className="mt-3 text-[14px] text-muted">
              Una página lista para presentar a tu equipo o a un cliente. Elige el cultivo, el periodo en la barra superior y, si quieres,
              una variedad. Se guarda como PDF desde el botón.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="min-w-[200px]">
              <span className="sr-only">Variedad</span>
              <select
                value={variedad ?? ''}
                onChange={(e) => setVariedad(e.target.value || null)}
                className={cn(
                  'crop-tint w-full rounded-lg border px-3 py-2.5 text-[13.5px]',
                  variedad ? 'border-crop bg-crop-soft text-crop-ink' : 'border-line bg-paper',
                )}
              >
                <option value="">Todo el cultivo</option>
                {(data?.variedades_disponibles ?? []).map((v) => <option key={v} value={v}>{titulo(v)}</option>)}
              </select>
            </label>
            <button onClick={copiar} className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-[13.5px] hover:border-faint">
              {copiado ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
            <button
                           onClick={() => puedeDescargar() && window.print()}
              disabled={!data || data.t <= 0}
              className="crop-tint flex items-center gap-2 rounded-lg bg-crop px-4 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110 disabled:opacity-50"
            >
              <Printer className="size-4" />
              Descargar PDF
            </button>
          </div>
        </header>
      </div>

      <div className={cn('mx-auto mt-8 max-w-[980px] transition-opacity print:mt-0 print:max-w-none', isPlaceholderData && 'opacity-60')}>
        {!data ? (
          <Skeleton className="h-[1100px] w-full rounded-3xl" />
        ) : data.t <= 0 ? (
          <div className="rounded-3xl border border-line bg-paper px-6 py-16 text-center">
            <p className="font-medium">Sin envíos para esta combinación</p>
            <p className="mt-1 text-[13px] text-muted">
              No hay envíos de {variedad ? titulo(variedad) : cultivo.toLowerCase()} en {resumenPeriodo(anio, mesIni, mesFin).toLowerCase()}.
              Prueba con otra variedad o amplía el periodo.
            </p>
            {variedad && (
              <button onClick={() => setVariedad(null)} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] font-medium text-white">
                Ver todo el cultivo
              </button>
            )}
          </div>
        ) : (
          <HojaInforme data={data} cultivo={cultivo} periodo={resumenPeriodo(anio, mesIni, mesFin)} empresa={sesion?.empresa ?? null} />
        )}
      </div>

      <p className="mx-auto mt-4 max-w-[980px] text-[12px] text-faint print:hidden">
        En la ventana de impresión elige “Guardar como PDF”. El informe se ajusta a una hoja A4 con colores.
      </p>
    </div>
  );
}