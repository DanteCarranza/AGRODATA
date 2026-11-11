import { BadgeDollarSign, Globe2, type LucideIcon } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import { cn } from '@/lib/format';
import { useComercio } from './useComercio';
import { HeroComercio } from './components/HeroComercio';
import { CalendarioCompetencia } from './components/CalendarioCompetencia';
import { TransporteOrganico } from './components/TransporteOrganico';

const PROXIMAMENTE: { titulo: string; detalle: string; fuente: string; icono: LucideIcon }[] = [
  {
    titulo: 'Volumen de cada país competidor',
    detalle: 'Cuánto exporta Chile, México o Sudáfrica a cada destino, año a año, para ver la participación real de Perú.',
    fuente: 'UN Comtrade',
    icono: Globe2,
  },
  {
    titulo: 'Precios en destino',
    detalle: 'Precio mayorista en los mercados de llegada, para cerrar la cadena del FOB al precio que paga el comprador.',
    fuente: 'USDA Market News y Comisión Europea',
    icono: BadgeDollarSign,
  },
];

export default function ComercioPage() {
  const { crop } = useFiltros();
  const cultivo = cropById(crop).nombre;
  const { data, isError, error, refetch, isPlaceholderData } = useComercio(crop);

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo cargar comercio internacional</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-[13px] text-muted">Comercio internacional · {cultivo}</p>
        <h1 className="mt-1 font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
          Perú en el <span className="crop-tint text-crop">mundo</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          Cuánto exporta el país, a dónde, en qué meses compite con otros orígenes y cómo viaja la fruta. Esta página usa la base
          oficial completa, así que el filtro de periodo no aplica aquí.
        </p>
      </header>

      <div className={cn('mt-7 space-y-5 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data ? (
          <>
            <HeroComercio data={data} cultivo={cultivo} />
            <CalendarioCompetencia data={data} cultivo={cultivo} />
            <TransporteOrganico data={data} cultivo={cultivo} />
          </>
        ) : (
          <>
            <Skeleton className="h-[420px] w-full rounded-3xl" />
            <Skeleton className="h-[380px] w-full rounded-2xl" />
          </>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-[18px] font-semibold tracking-tight">Lo que viene en este módulo</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {PROXIMAMENTE.map((p) => {
            const Icono = p.icono;
            return (
              <div key={p.titulo} className="flex gap-4 rounded-2xl border border-dashed border-line bg-paper/60 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-muted"><Icono className="size-5" aria-hidden /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-semibold">{p.titulo}</h3>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] text-muted">Próximamente</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{p.detalle}</p>
                  <p className="mt-2 text-[12px] text-faint">Fuente: {p.fuente}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}