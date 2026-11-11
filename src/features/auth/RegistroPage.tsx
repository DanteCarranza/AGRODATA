import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { CROPS } from '@/config/crops';
import { ORDEN_PERFILES, PERFILES } from '@/config/acceso';
import { useFiltros } from '@/store/filtros';
import { avisar } from '@/store/avisos';
import { cn } from '@/lib/format';
import type { CropId, PerfilUsuario } from '@/types/agro';
import { Campo } from './components/Campo';
import { CLAVE_MIN, correoValido } from './validar';
import { useRegistro } from './useAuth';

export default function RegistroPage() {
  const navigate = useNavigate();
  const setCrop = useFiltros((s) => s.setCrop);
  const registro = useRegistro();
  const [f, setF] = useState({ nombre: '', empresa: '', correo: '', clave: '' });
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [cultivo, setCultivo] = useState<CropId | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [tocado, setTocado] = useState(false);

  const err = {
    nombre: tocado && f.nombre.trim().length < 3 ? 'Escribe tu nombre' : null,
    empresa: tocado && f.empresa.trim().length < 2 ? 'Escribe el nombre de tu empresa' : null,
    correo: tocado && !correoValido(f.correo) ? 'Escribe un correo válido' : null,
    clave: tocado && f.clave.length < CLAVE_MIN ? `Mínimo ${CLAVE_MIN} caracteres` : null,
    perfil: tocado && !perfil ? 'Elige cómo usarás la plataforma' : null,
    cultivo: tocado && !cultivo ? 'Elige un cultivo' : null,
    acepta: tocado && !acepta ? 'Debes aceptar para crear la cuenta' : null,
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTocado(true);
    const ok = f.nombre.trim().length >= 3 && f.empresa.trim().length >= 2 && correoValido(f.correo) && f.clave.length >= CLAVE_MIN && perfil && cultivo && acepta;
    if (!ok) return;
    registro.mutate(
      { ...f, perfil: perfil!, cultivo: cultivo! },
      {
        onSuccess: (s) => {
          setCrop(cultivo!);
          avisar({ tono: 'ok', texto: 'Tu prueba gratis de 7 días empezó. Tienes el plan Profesional con un cultivo.' });
          navigate(PERFILES[s.perfil].inicio, { replace: true });
        },
      },
    );
  };

  return (
    <div>
      <h2 className="font-display text-[32px] leading-tight font-semibold tracking-[-0.03em]">Crea tu cuenta</h2>
      <p className="mt-2 text-[14px] text-muted">
        7 días gratis del plan Profesional con un cultivo, sin tarjeta. ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="crop-tint font-medium text-crop hover:underline">Ingresa</Link>
      </p>

      <form onSubmit={enviar} noValidate className="mt-7 space-y-7">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">Tus datos</legend>
          <Campo etiqueta="Nombre y apellido" autoComplete="name" value={f.nombre} onChange={set('nombre')} error={err.nombre} />
          <Campo etiqueta="Empresa" autoComplete="organization" value={f.empresa} onChange={set('empresa')} error={err.empresa} />
          <Campo etiqueta="Correo de trabajo" type="email" autoComplete="email" value={f.correo} onChange={set('correo')} error={err.correo} className="sm:col-span-2" />
          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete="new-password"
            value={f.clave}
            onChange={set('clave')}
            error={err.clave}
            ayuda={`Mínimo ${CLAVE_MIN} caracteres`}
            className="sm:col-span-2"
          />
        </fieldset>

        <fieldset>
          <legend className="text-[13px] font-medium">¿Cómo usarás AgroDataCore?</legend>
          <p className="mt-0.5 text-[12.5px] text-muted">Tu menú se ordena para mostrar primero lo que más te importa. Puedes cambiarlo después.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ORDEN_PERFILES.map((k) => {
              const p = PERFILES[k];
              const on = perfil === k;
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setPerfil(k)}
                  aria-pressed={on}
                  className={cn(
                    'crop-tint flex gap-3 rounded-xl border p-3 text-left transition-colors',
                    on ? 'border-crop bg-crop-soft' : 'border-line bg-paper hover:border-faint',
                    k === 'analista' && 'sm:col-span-2',
                  )}
                >
                  <span className={cn('crop-tint grid size-9 shrink-0 place-items-center rounded-lg', on ? 'bg-crop text-white' : 'bg-surface text-muted')}>
                    <p.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{p.nombre}</span>
                    <span className="block text-[12px] leading-snug text-muted">{p.descripcion}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {err.perfil && <p className="mt-1.5 text-[12px] text-bad">{err.perfil}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-[13px] font-medium">Cultivo para tu prueba</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {CROPS.map((c) => {
              const on = cultivo === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCultivo(c.id)}
                  aria-pressed={on}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px]',
                    on ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-faint hover:text-ink',
                  )}
                >
                  {on && <Check className="size-3.5" />}
                  {c.nombre}
                </button>
              );
            })}
          </div>
          {err.cultivo && <p className="mt-1.5 text-[12px] text-bad">{err.cultivo}</p>}
        </fieldset>

        <div>
          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-muted">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--color-crop)]" />
            Acepto los términos de uso y el tratamiento de mis datos personales conforme a la Ley N.° 29733.
          </label>
          {err.acepta && <p className="mt-1.5 text-[12px] text-bad">{err.acepta}</p>}
        </div>

        {registro.isError && (
          <p className="flex items-center gap-2 rounded-xl bg-bad/8 px-3.5 py-2.5 text-[13px] text-bad" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            {registro.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={registro.isPending}
          className="crop-tint flex w-full items-center justify-center gap-2 rounded-xl bg-crop px-4 py-3 text-[14px] font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {registro.isPending && <Loader2 className="size-4 animate-spin" />}
          Crear cuenta y empezar la prueba
        </button>
      </form>
    </div>
  );
}