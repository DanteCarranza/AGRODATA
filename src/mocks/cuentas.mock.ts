/**
 * Cuentas de demostración y estado de la cuenta conectada (solo modo mock).
 * La cuenta vive en localStorage para que sobreviva a recargas; en producción todo esto es del backend.
 * Las fechas se calculan desde hoy para que cada demo muestre siempre su caso (por vencer, vencida, etc.).
 */
import type { CampanaHistorica, CropId, Facturacion, PerfilUsuario, PlanId, Sesion } from '@/types/agro';
import { MESES } from '@/config/crops';
import { ApiError } from '@/lib/api';

export interface CuentaDemo {
  id: string;
  nombre: string;
  correo: string;
  empresa: string;
  perfil: PerfilUsuario;
  plan: PlanId;
  prueba: boolean;
  cultivos: CropId[];
  facturacion: Facturacion;
  inicio: string;
  vence: string;
  desbloqueadas: string[];
  solicitadas: string[];
}

const TODOS: CropId[] = ['uva', 'palta', 'arandano', 'mango', 'limon'];

export const isoDias = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Para el selector de la pantalla de ingreso */
export const DEMOS: { id: string; titulo: string; detalle: string; crear: () => CuentaDemo }[] = [
  {
    id: 'profesional',
    titulo: 'Profesional',
    detalle: '3 cultivos, anual',
    crear: () => ({
      id: 'profesional', nombre: 'Lucía Paredes', correo: 'profesional@agrodatacore.test', empresa: 'Agrícola Demostración S.A.C.',
      perfil: 'exportador', plan: 'profesional', prueba: false, cultivos: ['uva', 'palta', 'arandano'], facturacion: 'anual',
      inicio: isoDias(-308), vence: isoDias(57), desbloqueadas: [`uva:${etiquetaCampana(anioCampanaActual('uva') - 3, 8)}`], solicitadas: [],
    }),
  },
  {
    id: 'esencial',
    titulo: 'Esencial',
    detalle: '1 cultivo, vence en 9 días',
    crear: () => ({
      id: 'esencial', nombre: 'Marco Quispe', correo: 'esencial@agrodatacore.test', empresa: 'Frutos del Valle E.I.R.L.',
      perfil: 'general', plan: 'esencial', prueba: false, cultivos: ['palta'], facturacion: 'mensual',
      inicio: isoDias(-22), vence: isoDias(8), desbloqueadas: [], solicitadas: [],
    }),
  },
  {
    id: 'enterprise',
    titulo: 'Enterprise',
    detalle: 'todos los cultivos',
    crear: () => ({
      id: 'enterprise', nombre: 'Andrea Salas', correo: 'enterprise@agrodatacore.test', empresa: 'Exportadora Demostración S.A.',
      perfil: 'licenciatario', plan: 'enterprise', prueba: false, cultivos: TODOS, facturacion: 'anual',
      inicio: isoDias(-100), vence: isoDias(265), desbloqueadas: [], solicitadas: [],
    }),
  },
  {
    id: 'vencida',
    titulo: 'Vencida',
    detalle: 'solo lectura',
    crear: () => ({
      id: 'vencida', nombre: 'Jorge Ramos', correo: 'vencida@agrodatacore.test', empresa: 'Agroexport Ejemplo S.A.C.',
      perfil: 'importador', plan: 'esencial', prueba: false, cultivos: ['uva'], facturacion: 'mensual',
      inicio: isoDias(-33), vence: isoDias(-3), desbloqueadas: [], solicitadas: [],
    }),
  },
];

/* ---------- Cuenta conectada ---------- */

const CLAVE = 'adc-demo-cuenta';

export function cuentaActual(): CuentaDemo {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return JSON.parse(raw) as CuentaDemo;
  } catch {
    /* almacenamiento bloqueado */
  }
  throw new ApiError(401, 'Sesión no iniciada');
}

export function guardarCuenta(c: CuentaDemo | null) {
  try {
    if (c) localStorage.setItem(CLAVE, JSON.stringify(c));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento bloqueado */
  }
}

/* ---------- Campañas ---------- */

/** Inicio de campaña por cultivo (mes 1-12). Uva confirmada con la data; el resto, estimado en el mes valle. */
export const VENTANA: Record<CropId, { iniM: number; estimada: boolean }> = {
  uva: { iniM: 8, estimada: false },
  palta: { iniM: 2, estimada: true },
  arandano: { iniM: 3, estimada: true },
  mango: { iniM: 7, estimada: true },
  limon: { iniM: 1, estimada: true },
};

/** Precio de una campaña cerrada según su antigüedad (pago único, US$ sin IGV) */
const PRECIO_HISTORICO = [2600, 2000, 1500, 1100];
/** Campañas cerradas que trae cada plan además de la temporada en curso */
const CERRADAS_INCLUIDAS: Record<PlanId, number> = { esencial: 0, profesional: 2, enterprise: Infinity };

const etiquetaCampana = (anio: number, iniM: number) =>
  iniM === 1 ? String(anio) : `${anio}-${String((anio + 1) % 100).padStart(2, '0')}`;

const anioCampanaActual = (crop: CropId) => {
  const hoy = new Date();
  return hoy.getMonth() + 1 >= VENTANA[crop].iniM ? hoy.getFullYear() : hoy.getFullYear() - 1;
};

export function campanasDe(crop: CropId, c: CuentaDemo): CampanaHistorica[] {
  const { iniM } = VENTANA[crop];
  const actual = anioCampanaActual(crop);
  const finM = ((iniM + 10) % 12) + 1;
  return Array.from({ length: 7 }, (_, i) => {
    const anio = actual - i;
    const etiqueta = etiquetaCampana(anio, iniM);
    const id = `${crop}:${etiqueta}`;
    const estado =
      i === 0 ? 'en_curso'
        : i <= CERRADAS_INCLUIDAS[c.plan] ? 'incluida'
          : c.desbloqueadas.includes(id) ? 'desbloqueada'
            : c.solicitadas.includes(id) ? 'solicitada'
              : 'bloqueada';
    return {
      id,
      etiqueta,
      ventana: `${MESES[iniM - 1]} ${anio} – ${MESES[finM - 1]} ${iniM === 1 ? anio : anio + 1}`,
      estado,
      precio_usd: estado === 'bloqueada' ? PRECIO_HISTORICO[Math.min(i - 1, PRECIO_HISTORICO.length - 1)] : null,
    } satisfies CampanaHistorica;
  });
}

/** Año calendario desde el que el cliente puede consultar cada cultivo (inicio de su campaña más antigua disponible) */
function historialDesde(c: CuentaDemo): Sesion['historial_desde'] {
  if (c.plan === 'enterprise') return {};
  const r: Sesion['historial_desde'] = {};
  for (const crop of c.cultivos) {
    const actual = anioCampanaActual(crop);
    let desde = actual - CERRADAS_INCLUIDAS[c.plan];
    for (const id of c.desbloqueadas) {
      if (!id.startsWith(`${crop}:`)) continue;
      desde = Math.min(desde, Number(id.split(':')[1].slice(0, 4)));
    }
    r[crop] = desde;
  }
  return r;
}

export function sesionDe(c: CuentaDemo): Sesion {
  return {
    nombre: c.nombre,
    correo: c.correo,
    empresa: c.empresa,
    perfil: c.perfil,
    plan: c.plan,
    prueba: c.prueba,
    cultivos: c.plan === 'enterprise' ? TODOS : c.cultivos,
    vence: c.vence,
    historial_desde: historialDesde(c),
  };
}