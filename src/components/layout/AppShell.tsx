import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CropSwitcher } from './CropSwitcher';
import { PeriodFilter } from './PeriodFilter';
import { CommandSearch, useAtajoBusqueda } from './CommandSearch';
import { AvisoVencimiento } from './AvisoVencimiento';
import { BloqueoPlan } from './BloqueoPlan';
import { Avisos } from '@/components/ui/Avisos';
import { useFiltros } from '@/store/filtros';
import { USE_MOCKS } from '@/lib/api';
import { setSoloLectura } from '@/lib/acceso';
import { cultivoIncluido, planIncluye } from '@/config/acceso';
import { diasParaVencer, useSesionActiva } from '@/features/sesion/useSesion';

export function AppShell() {
  const { crop, anio, setCrop, setPeriodo } = useFiltros();
  const sesion = useSesionActiva();
  const [menu, setMenu] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const { pathname } = useLocation();
  const abrirBusqueda = useCallback(() => setBuscar(true), []);
  useAtajoBusqueda(abrirBusqueda);

  // El cultivo activo tiñe toda la interfaz
  useEffect(() => {
    document.documentElement.dataset.crop = crop;
  }, [crop]);

  // Llaves obligatorias: en Chromium reciente scrollTo devuelve una Promise y React la tomaría como cleanup
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Lo guardado en el navegador puede quedar fuera del plan (otra cuenta, plan que bajó): se corrige al entrar
  useEffect(() => {
    if (!cultivoIncluido(sesion, crop) && sesion.cultivos.length) setCrop(sesion.cultivos[0]);
  }, [sesion, crop, setCrop]);

  const desde = sesion.historial_desde[crop];
  useEffect(() => {
    if (anio !== null && desde !== undefined && anio < desde) setPeriodo({ anio: null });
  }, [anio, desde, setPeriodo]);

  useEffect(() => {
    setSoloLectura(diasParaVencer(sesion.vence) < 0);
  }, [sesion.vence]);

  return (
    <div className="flex min-h-full">
      <Sidebar abierto={menu} onCerrar={() => setMenu(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur print:hidden">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 2xl:px-10">
            <button onClick={() => setMenu(true)} className="rounded-md p-1.5 text-muted hover:text-ink lg:hidden" aria-label="Abrir menú">
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <CropSwitcher />
            </div>
            {USE_MOCKS && (
              <span
                className="hidden shrink-0 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-[12px] font-medium text-warn xl:inline"
                title="Las cifras salen de la muestra embebida en el prototipo, no de la base de datos completa"
              >
                Datos de muestra
              </span>
            )}
            <div className="hidden sm:block">
              <PeriodFilter />
            </div>
            <button
              onClick={abrirBusqueda}
              className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] text-muted hover:border-faint hover:text-ink"
              aria-label="Buscar"
            >
              <Search className="size-4" />
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden rounded border border-line px-1 text-[11px] md:inline">Ctrl K</kbd>
            </button>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <PeriodFilter />
          </div>
        </header>

        <AvisoVencimiento />

        <main className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10 print:p-0">
          {planIncluye(sesion.plan, pathname) ? <Outlet /> : <BloqueoPlan ruta={pathname} />}
        </main>
      </div>

      <CommandSearch abierto={buscar} onCerrar={() => setBuscar(false)} />
      <Avisos />
    </div>
  );
}