import { CalendarRange, Sprout, Target, type LucideIcon } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import { cn } from '@/lib/format';
import type { VistaIntel } from '@/types/agro';
import { useDetalleVariedad, useOportunidades, useSaturacion, useVariedades, useVistaIntel } from './useInteligencia';
import { VistaOportunidades } from './components/VistaOportunidades';
import { VistaSaturacion } from './components/VistaSaturacion';
import { VistaVariedades } from './components/VistaVariedades';

const VISTAS: { k: VistaIntel; titulo: string; detalle: string; icono: LucideIcon }[] = [
  { k: 'oportunidades', titulo: 'A quién venderle ahora', detalle: 'Importadores que entran a su temporada', icono: Target },
  { k: 'saturacion', titulo: 'Cuándo se llena cada mercado', detalle: 'Llegadas y competencia por mes', icono: CalendarRange },
  { k: 'variedades', titulo: 'Variedades', detalle: 'Cuáles ganan terreno y cuándo salen', icono: Sprout },
];

export default function InteligenciaPage() {
  const { crop, anio } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const { vista, pais, destino, variedad, set } = useVistaIntel();
  const params = { crop, anio };

  const op = useOportunidades(params, vista === 'oportunidades');
  const sat = useSaturacion(params, vista === 'saturacion');
  const vars = useVariedades(params, vista === 'variedades');
  const variedadSel = variedad ?? vars.data?.variedades[0]?.n ?? null;
  const det = useDetalleVariedad(crop, anio, vista === 'variedades' ? variedadSel : null);

  const actual = { oportunidades: op, saturacion: sat, variedades: vars }[vista];

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-[13px] text-muted">Inteligencia · {cultivo}, {anio ? `año ${anio}` : 'todo el histórico'}</p>
        <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
          A quién, cuándo y <span className="crop-tint text-crop">qué vender</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          Patrones que salen de los envíos reales: en qué meses compra cada importador, cuándo se llena cada mercado de fruta
          peruana y qué variedades ganan terreno. Del periodo solo se usa el año, para leer siempre la temporada completa.
        </p>
      </header>

      <nav role="tablist" aria-label="Vistas de inteligencia" className="mt-7 grid gap-2 sm:grid-cols-3">
        {VISTAS.map((v) => {
          const on = vista === v.k;
          const Icono = v.icono;
          return (
            <button
              key={v.k}
              role="tab"
              aria-selected={on}
              onClick={() => set({ vista: v.k === 'oportunidades' ? null : v.k })}
              className={cn(
                'crop-tint flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                on ? 'border-crop bg-crop-soft' : 'border-line bg-paper hover:border-faint',
              )}
            >
              <span className={cn('crop-tint grid size-10 shrink-0 place-items-center rounded-xl', on ? 'bg-crop text-white' : 'bg-surface text-muted')}>
                <Icono className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={cn('block text-[14px] font-semibold', on && 'text-crop-ink')}>{v.titulo}</span>
                <span className="block truncate text-[12.5px] text-muted">{v.detalle}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className={cn('mt-6 transition-opacity', actual.isPlaceholderData && 'opacity-60')}>
        {actual.isError ? (
          <div className="rounded-2xl border border-bad/30 bg-paper p-6">
            <p className="font-medium">No se pudo cargar esta vista</p>
            <p className="mt-1 text-[13px] text-muted">{actual.error?.message}. Revisa que el backend esté en línea.</p>
            <button onClick={() => actual.refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
          </div>
        ) : vista === 'oportunidades' ? (
          op.data ? (
            <VistaOportunidades key={pais ?? ''} data={op.data} cultivo={cultivo} pais={pais} onPais={(p) => set({ pais: p })} />
          ) : <Skeleton className="h-[640px] w-full rounded-3xl" />
        ) : vista === 'saturacion' ? (
          sat.data ? (
            <VistaSaturacion data={sat.data} cultivo={cultivo} destino={destino} onDestino={(d) => set({ destino: d })} />
          ) : <Skeleton className="h-[640px] w-full rounded-2xl" />
        ) : vars.data ? (
          <VistaVariedades
            data={vars.data}
            detalle={det.data}
            cargandoDetalle={det.isFetching}
            variedad={variedadSel}
            onVariedad={(v) => set({ variedad: v })}
          />
        ) : <Skeleton className="h-[640px] w-full rounded-2xl" />}
      </div>

      <p className="mt-8 text-[12px] text-faint">
        Precios FOB y proyecciones llegarán cuando conectemos fuentes de precios oficiales; hoy no se muestran cifras en dólares para
        no presentar estimaciones como datos reales.
      </p>
    </div>
  );
}