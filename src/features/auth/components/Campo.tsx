import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/format';

/** Campo de formulario con etiqueta, ayuda y error; las contraseñas traen botón para mostrarlas */
export function Campo({
  etiqueta, error, ayuda, extra, type = 'text', className, ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string | null;
  ayuda?: string;
  /** contenido a la derecha de la etiqueta (p. ej. "¿Olvidaste tu contraseña?") */
  extra?: ReactNode;
}) {
  const id = useId();
  const [ver, setVer] = useState(false);
  const clave = type === 'password';

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium">{etiqueta}</label>
        {extra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={clave && ver ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error || ayuda ? `${id}-d` : undefined}
          className={cn(
            'crop-tint w-full rounded-xl border bg-paper px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-crop',
            error ? 'border-bad' : 'border-line',
            clave && 'pr-11',
          )}
          {...input}
        />
        {clave && (
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {ver ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {(error || ayuda) && (
        <p id={`${id}-d`} className={cn('mt-1.5 text-[12px]', error ? 'text-bad' : 'text-muted')}>{error ?? ayuda}</p>
      )}
    </div>
  );
}