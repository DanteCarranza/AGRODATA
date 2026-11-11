import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Campo } from './components/Campo';
import { CLAVE_MIN } from './validar';
import { useRestablecer } from './useAuth';

/** Llega desde el enlace del correo: #/restablecer?token=… */
export default function RestablecerPage() {
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? '';
  const restablecer = useRestablecer();
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [tocado, setTocado] = useState(false);

  const errClave = tocado && clave.length < CLAVE_MIN ? `Mínimo ${CLAVE_MIN} caracteres` : null;
  const errRepetir = tocado && repetir !== clave ? 'Las contraseñas no coinciden' : null;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTocado(true);
    if (clave.length >= CLAVE_MIN && clave === repetir) restablecer.mutate({ token, clave });
  };

  if (!token) {
    return (
      <div>
        <h2 className="font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">Enlace no válido</h2>
        <p className="mt-2 text-[14px] text-muted">El enlace está incompleto o ya venció. Pide uno nuevo.</p>
        <Link to="/recuperar" className="crop-tint mt-6 inline-block rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white">Pedir otro enlace</Link>
      </div>
    );
  }

  if (restablecer.isSuccess) {
    return (
      <div>
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 className="mt-4 font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">Contraseña actualizada</h2>
        <p className="mt-2 text-[14px] text-muted">Ya puedes ingresar con tu nueva contraseña.</p>
        <Link to="/login" className="crop-tint mt-6 inline-block rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white">Ingresar</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-[32px] leading-tight font-semibold tracking-[-0.03em]">Crea una contraseña nueva</h2>
      <p className="mt-2 text-[14px] text-muted">Al guardarla se cerrarán las sesiones abiertas en otros equipos.</p>
      <form onSubmit={enviar} noValidate className="mt-7 space-y-4">
        <Campo etiqueta="Contraseña nueva" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} error={errClave} ayuda={`Mínimo ${CLAVE_MIN} caracteres`} />
        <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} error={errRepetir} />
        {restablecer.isError && (
          <p className="flex items-center gap-2 rounded-xl bg-bad/8 px-3.5 py-2.5 text-[13px] text-bad" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            {restablecer.error.message}
          </p>
        )}
        <button
          type="submit"
          disabled={restablecer.isPending}
          className="crop-tint flex w-full items-center justify-center gap-2 rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {restablecer.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar contraseña
        </button>
      </form>
    </div>
  );
}