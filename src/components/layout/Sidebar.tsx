import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Lock, LogOut, X } from 'lucide-react';
import { navPara } from '@/config/nav';
import { ORDEN_PERFILES, PERFILES, PLAN_MINIMO, PLAN_NOMBRE, planIncluye } from '@/config/acceso';
import { cn } from '@/lib/format';
import { diasParaVencer, useSesionActiva } from '@/features/sesion/useSesion';
import { useCambiarPerfil, useLogout } from '@/features/auth/useAuth';
import { Logo } from '@/components/ui/Logo';
import type { PerfilUsuario } from '@/types/agro';

const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Quién está conectado, su plan, cuándo vence, para qué usa la plataforma y la salida */
function Cuenta({ onNavegar }: { onNavegar: () => void }) {
  const s = useSesionActiva();
  const navigate = useNavigate();
  const logout = useLogout();
  const perfil = useCambiarPerfil();
  const dias = diasParaVencer(s.vence);
  const iniciales = s.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('');

  const salir = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  return (
    <div className="mx-3 mb-3 rounded-xl bg-forest-2 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-[13px] font-semibold text-mint" aria-hidden>
          {iniciales}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium text-white">{s.nombre}</div>
          <div className="truncate text-[11.5px] text-[#8aa398]">{s.empresa}</div>
        </div>
        <button
          onClick={salir}
          disabled={logout.isPending}
          className="rounded-md p-1.5 text-[#8aa398] hover:bg-white/5 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>
      <div className="mt-3 text-[11.5px] leading-snug">
        <span className="inline-block rounded-full bg-mint/15 px-2 py-0.5 font-medium whitespace-nowrap text-mint">
          {s.prueba ? `Prueba ${PLAN_NOMBRE[s.plan]}` : `Plan ${PLAN_NOMBRE[s.plan]}`}
        </span>
        <div className="mt-1.5">
          {dias <= 15 ? (
            <Link to="/suscripcion" onClick={onNavegar} className="font-medium text-[#f2c48d] hover:underline">
              {dias < 0
                ? 'Suscripción vencida. Renuévala aquí'
                : s.prueba
                  ? `Tu prueba termina en ${dias} ${dias === 1 ? 'día' : 'días'}. Elige un plan`
                  : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}. Renuévala aquí`}
            </Link>
          ) : (
            <span className="text-[#8aa398]">Activo hasta el {fechaCorta.format(new Date(`${s.vence}T12:00:00`))}</span>
          )}
        </div>
      </div>
      <label className="mt-3 block border-t border-white/5 pt-2.5 text-[11.5px] text-[#8aa398]">
        Menú pensado para
        <select
          value={s.perfil}
          onChange={(e) => perfil.mutate(e.target.value as PerfilUsuario)}
          disabled={perfil.isPending}
          className="mt-1 w-full rounded-md border border-white/10 bg-forest px-2 py-1.5 text-[12.5px] text-white"
        >
          {ORDEN_PERFILES.map((k) => <option key={k} value={k}>{PERFILES[k].nombre}</option>)}
        </select>
      </label>
    </div>
  );
}

export function Sidebar({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const s = useSesionActiva();
  const grupos = navPara(PERFILES[s.perfil].paraTi);

  return (
    <>
      <div
        className={cn('fixed inset-0 z-40 bg-forest/50 lg:hidden', abierto ? 'block' : 'hidden')}
        onClick={onCerrar}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-forest text-[#c9d6cf] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegación principal"
      >
        <div className="flex items-start justify-between">
          <Logo className="px-5 pt-5 pb-6" />
          <button onClick={onCerrar} className="mt-5 mr-3 rounded-md p-1.5 text-[#8aa398] hover:text-white lg:hidden" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
          {grupos.map((g) => (
            <div key={g.titulo} className="mb-5">
              <div className={cn('px-3 pb-1.5 text-[12px] font-medium', g.titulo === 'Para ti' ? 'text-mint/80' : 'text-[#6f8a7e]')}>{g.titulo}</div>
              <ul className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon }) => {
                  const bloqueado = !planIncluye(s.plan, to);
                  return (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/'}
                        onClick={onCerrar}
                        title={bloqueado ? `Disponible en el plan ${PLAN_NOMBRE[PLAN_MINIMO[to]]}` : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors',
                            isActive ? 'bg-forest-2 font-medium text-white' : 'hover:bg-white/5 hover:text-white',
                            bloqueado && !isActive && 'text-[#7f998d]',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={cn('size-[17px] shrink-0', isActive ? 'text-mint' : 'text-[#7f998d] group-hover:text-[#c9d6cf]')} />
                            <span className="truncate">{label}</span>
                            {bloqueado && <Lock className="ml-auto size-3.5 shrink-0 text-[#6f8a7e]" aria-label="No incluido en tu plan" />}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <Cuenta onNavegar={onCerrar} />

        <p className="border-t border-white/5 px-5 py-4 text-[11px] leading-relaxed text-[#6f8a7e]">
          Datos públicos oficiales de MIDAGRI, MINCETUR y MEF, tratados al amparo de la Ley N.° 27806.
        </p>
      </aside>
    </>
  );
}