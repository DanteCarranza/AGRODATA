import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { USE_MOCKS } from '@/lib/api';
import { PERFILES } from '@/config/acceso';
import { useSesion } from '@/features/sesion/useSesion';
import type { Sesion } from '@/types/agro';
import { DEMOS } from '@/mocks/cuentas.mock';
import { Campo } from './components/Campo';
import { CLAVE_MIN, correoValido } from './validar';
import { useLogin, useLoginDemo } from './useAuth';

export default function LoginPage() {
  const [sp] = useSearchParams();
  const volver = sp.get('volver');
  const navigate = useNavigate();
  const { data: sesion } = useSesion();
  const login = useLogin();
  const demo = useLoginDemo();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [tocado, setTocado] = useState(false);

  const destino = (s: Sesion) => (volver?.startsWith('/') ? volver : PERFILES[s.perfil].inicio);
  const entrar = (s: Sesion) => navigate(destino(s), { replace: true });

  // Ya hay sesión (o se acaba de iniciar): directo a la página pedida o a la de su perfil
  if (sesion) return <Navigate to={destino(sesion)} replace />;

  const errCorreo = tocado && !correoValido(correo) ? 'Escribe un correo válido' : null;
  const errClave = tocado && clave.length < CLAVE_MIN ? `Mínimo ${CLAVE_MIN} caracteres` : null;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTocado(true);
    if (!correoValido(correo) || clave.length < CLAVE_MIN) return;
    login.mutate({ correo, clave, recordar }, { onSuccess: entrar });
  };

  return (
    <div>
      <h2 className="font-display text-[32px] leading-tight font-semibold tracking-[-0.03em]">Ingresa a tu cuenta</h2>
      <p className="mt-2 text-[14px] text-muted">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="crop-tint font-medium text-crop hover:underline">Pruébala gratis 7 días</Link>
      </p>
      {volver && <p className="mt-4 rounded-xl bg-crop-soft px-3.5 py-2.5 text-[13px] text-crop-ink crop-tint">Ingresa para continuar donde estabas.</p>}

      <form onSubmit={enviar} noValidate className="mt-7 space-y-4">
        <Campo etiqueta="Correo" type="email" autoComplete="email" placeholder="tu@empresa.com" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errCorreo} />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={errClave}
          extra={<Link to="/recuperar" className="crop-tint text-[12.5px] text-crop hover:underline">¿Olvidaste tu contraseña?</Link>}
        />
        <label className="flex items-center gap-2.5 text-[13px] text-muted">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="size-4 accent-[var(--color-crop)]" />
          Mantener la sesión iniciada en este equipo
        </label>

        {login.isError && (
          <p className="flex items-center gap-2 rounded-xl bg-bad/8 px-3.5 py-2.5 text-[13px] text-bad" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            {login.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="crop-tint flex w-full items-center justify-center gap-2 rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Ingresar
        </button>
      </form>

      {USE_MOCKS && (
        <section className="mt-9 border-t border-line pt-6">
          <h3 className="text-[13px] font-medium">Cuentas de demostración</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">Solo en modo demo: entra con un plan para ver cómo cambia la plataforma.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => demo.mutate(d.id, { onSuccess: entrar })}
                disabled={demo.isPending}
                className="crop-tint rounded-xl border border-line bg-paper px-3.5 py-3 text-left hover:border-crop disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-[13.5px] font-medium">
                  {demo.isPending && demo.variables === d.id && <Loader2 className="size-3.5 animate-spin" />}
                  {d.titulo}
                </span>
                <span className="block text-[12px] text-muted">{d.detalle}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}