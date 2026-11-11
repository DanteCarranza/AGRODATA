import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFiltros } from '@/store/filtros';
import { avisar } from '@/store/avisos';
import { CROPS, cropById } from '@/config/crops';
import { Skeleton } from '@/components/ui/Panel';
import type { CropId, Facturacion, SolicitudSuscripcion } from '@/types/agro';
import { useSolicitud, useSuscripcion } from './useSuscripcion';
import { HeroCuenta } from './components/HeroCuenta';
import { Planes } from './components/Planes';
import { Campanas } from './components/Campanas';
import { Comparacion } from './components/Comparacion';

const esCultivo = (c: string | null): c is CropId => CROPS.some((x) => x.id === c);

export default function SuscripcionPage() {
  const crop = useFiltros((s) => s.crop);
  // ?cultivo=mango abre las campañas de ese cultivo (llega desde el candado de la barra o del periodo); ?ver=planes baja a los planes
  const [sp, setSp] = useSearchParams();
  const cultivoUrl = sp.get('cultivo');
  const cultivoCampanas = esCultivo(cultivoUrl) ? cultivoUrl : crop;
  const ver = sp.get('ver');

  const { data, isError, error, refetch, isPlaceholderData } = useSuscripcion(cultivoCampanas);
  const solicitud = useSolicitud();
  const [facturacion, setFacturacion] = useState<Facturacion | null>(null);
  const cargado = !!data;

  useEffect(() => {
    if (!cargado) return;
    const destino = ver === 'planes' ? 'planes' : cultivoUrl ? 'campanas' : null;
    if (destino) document.getElementById(destino)?.scrollIntoView({ block: 'start' });
  }, [cargado, ver, cultivoUrl]);

  const pedir = (b: SolicitudSuscripcion) =>
    solicitud.mutate(b, {
      onSuccess: (r) => avisar({ tono: r.ok ? 'ok' : 'error', texto: r.mensaje }),
      onError: (e) => avisar({ tono: 'error', texto: `${e.message}. Inténtalo de nuevo.` }),
    });

  const v = solicitud.isPending ? solicitud.variables : null;

  if (isError) {
    return (
      <div className="rounded-2xl border border-bad/30 bg-paper p-6">
        <p className="font-medium">No se pudo cargar tu suscripción</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}. Revisa que el backend esté en línea.</p>
        <button onClick={() => refetch()} className="crop-tint mt-4 rounded-lg bg-crop px-4 py-2 text-[13px] text-white">Reintentar</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[520px] rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const plan = data.planes.find((p) => p.id === data.cuenta.plan)!;
  const fact = facturacion ?? data.cuenta.facturacion;

  return (
    <div className="space-y-10">
      <HeroCuenta
        cuenta={data.cuenta}
        plan={plan}
        renovando={v?.tipo === 'renovacion'}
        onRenovar={() => pedir({ tipo: 'renovacion', plan: data.cuenta.plan, facturacion: data.cuenta.facturacion })}
      />

      <Planes
        planes={data.planes}
        cuenta={data.cuenta}
        facturacion={fact}
        onFacturacion={setFacturacion}
        pendiente={v?.tipo === 'cambio_plan' ? v.plan ?? null : null}
        onElegir={(p) => pedir({ tipo: 'cambio_plan', plan: p, facturacion: fact })}
      />

      <Campanas
        data={data.campanas}
        cultivo={cropById(cultivoCampanas).nombre}
        contratados={data.cuenta.cultivos}
        onCultivo={(c) => setSp((prev) => {
          const n = new URLSearchParams(prev);
          n.set('cultivo', c);
          n.delete('ver');
          return n;
        }, { replace: true })}
        cargando={isPlaceholderData}
        pendiente={v?.tipo === 'campana' ? v.campana ?? null : v?.tipo === 'agregar_cultivo' ? 'cultivo' : null}
        onPedir={(c) => pedir({ tipo: 'campana', crop: cultivoCampanas, campana: c.id })}
        onAgregarCultivo={() => pedir({ tipo: 'agregar_cultivo', crop: cultivoCampanas })}
      />

      <Comparacion grupos={data.comparacion} planes={data.planes} actual={data.cuenta.plan} />

      <p className="max-w-3xl text-[12px] leading-relaxed text-faint">
        Precios en dólares, sin IGV (18 %), con pago anticipado. El plan anual cobra 10 meses. Cada pedido lo confirma nuestro equipo
        comercial antes de cobrar; nada se cobra desde esta página.
      </p>
    </div>
  );
}