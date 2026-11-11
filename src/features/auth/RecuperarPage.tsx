import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { USE_MOCKS } from '@/lib/api';
import { Campo } from './components/Campo';
import { correoValido } from './validar';
import { useRecuperar } from './useAuth';

export default function RecuperarPage() {
  const recuperar = useRecuperar();
  const [correo, setCorreo] = useState('');
  const [tocado, setTocado] = useState(false);
  const err = tocado && !correoValido(correo) ? 'Escribe un correo válido' : null;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTocado(true);
    if (correoValido(correo)) recuperar.mutate({ correo });
  };

  if (recuperar.isSuccess) {
    return (
      <div>
        <span className="crop-tint grid size-12 place-items-center rounded-2xl bg-crop-soft text-crop">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">Revisa tu correo</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Si <b className="font-medium text-ink">{correo.trim()}</b> tiene una cuenta, te llegará un enlace para crear una contraseña nueva.
          Mira también en spam. El enlace vence en 1 hora.
        </p>
        {USE_MOCKS && (
          <Link to="/restablecer?token=demo" className="crop-tint mt-5 inline-block text-[13.5px] font-medium text-crop hover:underline">
            Abrir el enlace de prueba (solo demo)
          </Link>
        )}
        <Link to="/login" className="mt-8 flex items-center gap-2 text-[13.5px] text-muted hover:text-ink">
          <ArrowLeft className="size-4" />
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-[32px] leading-tight font-semibold tracking-[-0.03em]">Recupera tu contraseña</h2>
      <p className="mt-2 text-[14px] text-muted">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.</p>
      <form onSubmit={enviar} noValidate className="mt-7 space-y-4">
        <Campo etiqueta="Correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={err} />
        <button
          type="submit"
          disabled={recuperar.isPending}
          className="crop-tint flex w-full items-center justify-center gap-2 rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {recuperar.isPending && <Loader2 className="size-4 animate-spin" />}
          Enviar enlace
        </button>
      </form>
      <Link to="/login" className="mt-8 flex items-center gap-2 text-[13.5px] text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Volver a ingresar
      </Link>
    </div>
  );
}