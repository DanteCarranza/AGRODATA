import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Sparkles, X } from 'lucide-react';
import { PLAN_NOMBRE } from '@/config/acceso';
import { diasParaVencer, useSesionActiva } from '@/features/sesion/useSesion';
import { cn } from '@/lib/format';

const fecha = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' });

const leer = (k: string) => {
  try {
    return sessionStorage.getItem(k) === '1';
  } catch {
    return false;
  }
};

/**
 * Franja bajo la barra superior: prueba gratis, plan por vencer (≤ 15 días) o vencido.
 * La de "por vencer" se puede cerrar durante la sesión; la de vencido no.
 */
export function AvisoVencimiento() {
  const s = useSesionActiva();
  const dias = diasParaVencer(s.vence);
  const clave = `adc-aviso-${s.vence}`;
  const [cerrado, setCerrado] = useState(() => leer(clave));
  const vence = fecha.format(new Date(`${s.vence}T12:00:00`));

  const tipo = dias < 0 ? 'vencida' : s.prueba ? 'prueba' : dias <= 15 ? 'pronto' : null;
  if (!tipo || (tipo !== 'vencida' && cerrado)) return null;

  const cerrar = () => {
    setCerrado(true);
    try {
      sessionStorage.setItem(clave, '1');
    } catch {
      /* almacenamiento bloqueado */
    }
  };

  const c = {
    vencida: {
      Icon: AlertTriangle,
      tono: 'bg-bad text-white',
      texto: `Tu suscripción venció el ${vence}. Puedes consultar la información, pero las descargas están desactivadas.`,
      accion: 'Renovar ahora',
      to: '/suscripcion',
    },
    prueba: {
      Icon: Sparkles,
      tono: 'bg-forest text-white',
      texto: `Prueba gratis del plan ${PLAN_NOMBRE[s.plan]}: te ${dias === 1 ? 'queda 1 día' : `quedan ${dias} días`} (hasta el ${vence}).`,
      accion: 'Elegir un plan',
      to: '/suscripcion?ver=planes',
    },
    pronto: {
      Icon: Clock,
      tono: 'bg-[#fbefe1] text-[#7a4108]',
      texto: `Tu plan ${PLAN_NOMBRE[s.plan]} vence en ${dias} ${dias === 1 ? 'día' : 'días'}, el ${vence}.`,
      accion: 'Renovar',
      to: '/suscripcion',
    },
  }[tipo];

  return (
    <div className={cn('print:hidden', c.tono)} role={tipo === 'vencida' ? 'alert' : 'status'}>
      <div className="flex items-center gap-3 px-4 py-2.5 text-[13px] sm:px-6 lg:px-8 2xl:px-10">
        <c.Icon className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 leading-snug">{c.texto}</p>
        <Link
          to={c.to}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap',
            tipo === 'pronto' ? 'bg-[#7a4108] text-white hover:brightness-110' : 'bg-white/15 hover:bg-white/25',
          )}
        >
          {c.accion}
        </Link>
        {tipo !== 'vencida' && (
          <button onClick={cerrar} className="shrink-0 rounded p-1 opacity-60 hover:opacity-100" aria-label="Ocultar aviso">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}