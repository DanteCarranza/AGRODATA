import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe2, Grape, MapPinned, Search, Store } from 'lucide-react';
import { useFiltros } from '@/store/filtros';
import { cropById } from '@/config/crops';
import { useBusqueda, type ResultadoBusqueda } from '@/features/busqueda/useBusqueda';
import { fmt, titulo } from '@/lib/format';

const GRUPOS: { tipo: ResultadoBusqueda['tipo']; titulo: string; icon: typeof Search }[] = [
  { tipo: 'exportador', titulo: 'Exportadores', icon: Building2 },
  { tipo: 'importador', titulo: 'Importadores', icon: Store },
  { tipo: 'variedad', titulo: 'Variedades', icon: Grape },
  { tipo: 'destino', titulo: 'Destinos', icon: Globe2 },
  { tipo: 'campo', titulo: 'Campos', icon: MapPinned },
];

export function useAtajoBusqueda(abrir: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const enCampo = (e.target as HTMLElement)?.closest('input,textarea,select');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !enCampo)) {
        e.preventDefault();
        abrir();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [abrir]);
}

export function CommandSearch({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const crop = useFiltros((s) => s.crop);
  const [q, setQ] = useState('');
  const { data = [], isFetching } = useBusqueda(crop, q);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) setQ('');
  }, [abierto]);

  const elegir = (r: ResultadoBusqueda) => {
    onCerrar();
    const n = encodeURIComponent(r.nombre);
    if (r.tipo === 'destino') navigate(`/?destino=${n}`);
    else if (r.tipo === 'campo') navigate(`/campos?campo=${n}`);
    else if (r.tipo === 'exportador') navigate(`/envios?exportador=${n}&ficha=${n}`);
    else if (r.tipo === 'importador') navigate(`/ranking?importador=${n}`);
    else navigate(`/envios?${r.tipo}=${n}`);
  };

  return (
    <Command.Dialog
      open={abierto}
      onOpenChange={(o) => !o && onCerrar()}
      shouldFilter={false}
      label="Buscar"
      overlayClassName="fixed inset-0 z-[60] bg-forest/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[12vh] z-[61] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_64px_-16px_rgba(14,34,25,.4)]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-4 text-muted" />
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder={`Busca en ${cropById(crop).nombre.toLowerCase()}: empresa, variedad, país, CLP o predio`}
          className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint focus-visible:outline-none"
        />
        <kbd className="rounded border border-line px-1.5 text-[11px] text-muted">Esc</kbd>
      </div>
      <Command.List className="scroll-thin max-h-[58vh] overflow-y-auto p-2">
        {q.trim().length < 2 && (
          <div className="px-3 py-8 text-center text-[13px] text-muted">Escribe al menos dos letras.</div>
        )}
        {q.trim().length >= 2 && !isFetching && data.length === 0 && (
          <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted">
            Nada coincide con “{q}” en {cropById(crop).nombre.toLowerCase()}. Prueba con otro cultivo.
          </Command.Empty>
        )}
        {GRUPOS.map(({ tipo, titulo: t, icon: Icon }) => {
          const items = data.filter((r) => r.tipo === tipo);
          if (!items.length) return null;
          return (
            <Command.Group
              key={tipo}
              heading={t}
              className="mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
            >
              {items.slice(0, 8).map((r) => (
                <Command.Item
                  key={tipo + r.nombre}
                  value={tipo + r.nombre}
                  onSelect={() => elegir(r)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] data-[selected=true]:bg-crop-soft data-[selected=true]:text-crop-ink"
                >
                  <Icon className="size-4 shrink-0 opacity-60" />
                  <span className="truncate">
                    {r.tipo === 'campo' ? <span className="num">{r.nombre}</span> : titulo(r.nombre)}
                    {r.detalle && <span className="ml-2 text-muted">{titulo(r.detalle)}</span>}
                  </span>
                  <span className="num ml-auto shrink-0 text-[12px] text-muted">{fmt(r.envios)} envíos</span>
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
}