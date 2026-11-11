import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAvisos, type Aviso } from '@/store/avisos';
import { cn } from '@/lib/format';

const ICONO = { ok: CheckCircle2, error: AlertCircle, info: Info };

function Item({ a }: { a: Aviso }) {
  const quitar = useAvisos((s) => s.quitar);
  useEffect(() => {
    const t = setTimeout(() => quitar(a.id), 7000);
    return () => clearTimeout(t);
  }, [a.id, quitar]);
  const Icon = ICONO[a.tono];

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[13.5px] text-white shadow-[0_18px_40px_-16px_rgba(14,34,25,0.55)]',
        a.tono === 'error' ? 'bg-bad' : 'bg-forest',
      )}
    >
      <Icon className={cn('mt-0.5 size-[18px] shrink-0', a.tono === 'ok' ? 'text-mint' : a.tono === 'info' ? 'text-[#f2c48d]' : 'text-white')} aria-hidden />
      <div className="flex-1 leading-snug">
        <p>{a.texto}</p>
        {a.accion && (
          <Link to={a.accion.to} onClick={() => quitar(a.id)} className="mt-1.5 inline-block font-medium text-mint hover:underline">
            {a.accion.texto}
          </Link>
        )}
      </div>
      <button onClick={() => quitar(a.id)} className="rounded p-0.5 text-white/60 hover:text-white" aria-label="Cerrar aviso">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Avisos() {
  const lista = useAvisos((s) => s.lista);
  if (!lista.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-stretch gap-2 sm:left-auto sm:w-[420px] print:hidden">
      {lista.map((a) => <Item key={a.id} a={a} />)}
    </div>
  );
}