import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { NAV_FLAT } from '@/config/nav';
import { titulo } from '@/lib/format';

export default function EnMigracion() {
  const { pathname } = useLocation();
  const [sp] = useSearchParams();
  const item = NAV_FLAT.find((n) => n.to === pathname);
  const Icon = item?.icon;
  const consulta = [...sp.entries()][0];

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      {Icon && (
        <div className="crop-tint mx-auto grid size-14 place-items-center rounded-2xl bg-crop-soft text-crop">
          <Icon className="size-7" />
        </div>
      )}
      <h1 className="mt-5 font-display text-[28px] font-semibold tracking-tight">{item?.label ?? 'Módulo'}</h1>
      <p className="mt-2 text-muted">
        Este módulo todavía vive en el prototipo y se migrará en la siguiente iteración con el mismo diseño del dashboard.
      </p>
      {consulta && (
        <p className="mt-4 text-[13px] text-muted">
          Búsqueda recibida: {consulta[0]} <span className="font-medium text-ink">{titulo(consulta[1])}</span>
        </p>
      )}
      <Link to="/" className="crop-tint mt-6 inline-block rounded-lg bg-crop px-4 py-2 text-[13.5px] font-medium text-white">
        Volver al dashboard
      </Link>
    </div>
  );
}