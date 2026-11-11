import { useSearchParams } from 'react-router-dom';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { Panel, Skeleton } from '@/components/ui/Panel';
import { resumenPeriodo } from '@/components/layout/PeriodFilter';
import { frase, titulo } from '@/lib/format';
import { useDashboard } from './useDashboard';
import { Hero } from './components/Hero';
import { CalendarioCampana } from './components/CalendarioCampana';
import { Destinos } from './components/Destinos';
import { Variedades } from './components/Variedades';
import { TablaRanking } from './components/TablaRanking';
import { Hallazgos } from './components/Hallazgos';

export default function DashboardPage() {
  const { crop, anio, mesIni, mesFin, setPeriodo } = useFiltros();
  const [sp, setSp] = useSearchParams();
  const destino = sp.get('destino');
  const setDestino = (d: string | null) => {
    const n = new URLSearchParams(sp);
    if (d) n.set('destino', d);
    else n.delete('destino');
    setSp(n, { replace: true });
  };

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useDashboard({ crop, anio, mesIni, mesFin, destino });
  const cdef = cropById(crop);
  const periodo = { anio, mesIni, mesFin };
  const sufijo = destino ? ` hacia ${titulo(destino)}` : '';

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <h1 className="font-display text-lg font-semibold">No se pudo cargar el dashboard</h1>
        <p className="mt-1 text-muted">{error.message}. Revisa que el backend esté en línea y vuelve a intentarlo.</p>
        <button onClick={() => refetch()} className="mt-4 rounded-lg bg-crop px-4 py-2 text-white">Reintentar</button>
      </div>
    );
  }

  return (
    <div className={isPlaceholderData ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
      <Hero crop={cdef} data={data} periodo={resumenPeriodo(anio, mesIni, mesFin)} destino={destino} onQuitarDestino={() => setDestino(null)} />

      <Panel
        className="mt-8"
        titulo="Lo que cambió"
        detalle={
          data?.comparativo
            ? `${data.comparativo.actual} frente a ${data.comparativo.anterior}${sufijo}, según la participación de cada uno en las toneladas.`
            : 'Comparación con el periodo anterior.'
        }
      >
        {isPending ? <Skeleton className="h-64 w-full" /> : <Hallazgos comparativo={data.comparativo} />}
      </Panel>

      <Panel
        className="mt-5"
        titulo="Calendario de campaña"
        detalle={`${frase(`Toneladas por mes y año${sufijo}`)} Cuanto más intenso, más fruta salió.`}
      >
        {isPending ? <Skeleton className="h-72 w-full" /> : (
          <CalendarioCampana celdas={data.calendario} anios={data.anios} periodo={periodo} onElegirAnio={(a) => setPeriodo({ anio: a })} />
        )}
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Panel titulo="Destinos" detalle="Envíos por país. Elige uno para ver quién exporta allí.">
          {isPending ? <Skeleton className="h-80 w-full" /> : <Destinos destinos={data.destinos} activo={destino} onElegir={setDestino} />}
        </Panel>
        <Panel titulo="Variedades" detalle={frase(`Participación en número de envíos${sufijo}`)}>
          {isPending ? <Skeleton className="h-64 w-full" /> : <Variedades variedades={data.variedades} />}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel titulo="Exportadores principales" detalle={`${frase(`Por toneladas${sufijo}`)} Elige una empresa para ver su ficha.`}>
          {isPending ? <Skeleton className="h-80 w-full" /> : <TablaRanking filas={data.exportadores} entidad="exportadores" enlace={(n) => `/envios?exportador=${encodeURIComponent(n)}&ficha=${encodeURIComponent(n)}`} />}
        </Panel>
        <Panel titulo="Importadores principales" detalle={`${frase(`Por toneladas${sufijo}`)} Elige uno para ver su perfil.`}>
          {isPending ? <Skeleton className="h-80 w-full" /> : <TablaRanking filas={data.importadores} entidad="importadores" enlace={(n) => `/ranking?importador=${encodeURIComponent(n)}`} />}
        </Panel>
      </div>
    </div>
  );
}