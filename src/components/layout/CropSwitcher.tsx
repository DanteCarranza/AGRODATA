import { Lock } from 'lucide-react';
import { CROPS } from '@/config/crops';
import { cultivoIncluido } from '@/config/acceso';
import { useFiltros } from '@/store/filtros';
import { avisar } from '@/store/avisos';
import { useSesionActiva } from '@/features/sesion/useSesion';
import { cn } from '@/lib/format';

const PUNTO: Record<string, string> = {
  uva: '#6d3a8c', palta: '#3b6b2e', arandano: '#34499c', mango: '#e08a1e', limon: '#9cbf1c',
};

/** Cultivos del plan para elegir; los no contratados se ven con candado y llevan a Suscripción */
export function CropSwitcher() {
  const crop = useFiltros((s) => s.crop);
  const setCrop = useFiltros((s) => s.setCrop);
  const sesion = useSesionActiva();

  return (
    <div role="radiogroup" aria-label="Cultivo" className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1">
      {CROPS.map((c) => {
        const on = c.id === crop;
        const incluido = cultivoIncluido(sesion, c.id);
        return (
          <button
            key={c.id}
            role="radio"
            aria-checked={on}
            aria-disabled={!incluido}
            title={incluido ? undefined : `${c.nombre} no está en tu plan`}
            onClick={() =>
              incluido
                ? setCrop(c.id)
                : avisar({
                    tono: 'info',
                    texto: `${c.nombre} no está en tu plan. Puedes agregarlo y ver su temporada en curso desde el primer día.`,
                    accion: { texto: `Agregar ${c.nombre.toLowerCase()}`, to: `/suscripcion?cultivo=${c.id}` },
                  })
            }
            className={cn(
              'crop-tint flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap',
              on
                ? 'border-crop bg-crop font-medium text-white'
                : incluido
                  ? 'border-line bg-paper text-muted hover:border-faint hover:text-ink'
                  : 'border-dashed border-line bg-transparent text-faint hover:text-muted',
            )}
          >
            {incluido ? (
              <span className="size-2 rounded-full" style={{ background: on ? 'rgba(255,255,255,.85)' : PUNTO[c.id] }} aria-hidden />
            ) : (
              <Lock className="size-3" aria-hidden />
            )}
            {c.nombre}
          </button>
        );
      })}
    </div>
  );
}