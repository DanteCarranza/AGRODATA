import { BarChart3, Building2, Globe, Sprout, Ship, type LucideIcon } from 'lucide-react';
import type { CropId, PerfilUsuario, PlanId, Sesion } from '@/types/agro';

export const PLAN_NOMBRE: Record<PlanId, string> = { esencial: 'Esencial', profesional: 'Profesional', enterprise: 'Enterprise' };
const RANGO: Record<PlanId, number> = { esencial: 0, profesional: 1, enterprise: 2 };

/**
 * Plan mínimo para abrir cada módulo. El backend debe aplicar la misma tabla y responder 403;
 * esto solo decide qué se muestra.
 */
export const PLAN_MINIMO: Record<string, PlanId> = {
  '/': 'esencial',
  '/envios': 'esencial',
  '/ranking': 'esencial',
  '/campos': 'esencial',
  '/acceso': 'esencial',
  '/alertas-sanitarias': 'esencial',
  '/alertas-fitosanitarias': 'esencial',
  '/suscripcion': 'esencial',
  '/trazabilidad': 'profesional',
  '/balance': 'profesional',
  '/inteligencia': 'profesional',
  '/comercio': 'profesional',
  '/informe': 'profesional',
};

export const planIncluye = (plan: PlanId, ruta: string) => RANGO[plan] >= RANGO[PLAN_MINIMO[ruta] ?? 'esencial'];
export const cultivoIncluido = (s: Pick<Sesion, 'plan' | 'cultivos'>, c: CropId) => s.plan === 'enterprise' || s.cultivos.includes(c);
export const rangoPlan = (p: PlanId) => RANGO[p];

/** Lo que gana el cliente al abrir un módulo bloqueado */
export const PITCH: Record<string, { titulo: string; puntos: string[] }> = {
  '/trazabilidad': {
    titulo: 'Sigue la fruta del campo al importador',
    puntos: ['Cadena región → variedad → destino', 'Rastreador por campo, exportador o importador', 'Qué exportadores mueven cada campo'],
  },
  '/balance': {
    titulo: 'Saldo de cada certificado fitosanitario',
    puntos: ['Cuánto certificó y cuánto embarcó cada campo', 'Fruta que todavía puede salir', 'Alertas de sobregiro de origen'],
  },
  '/inteligencia': {
    titulo: 'A quién vender, cuándo y qué variedad conviene',
    puntos: ['Importadores que entran a su temporada de compra', 'Meses en que cada mercado se satura', 'Variedades que ganan participación'],
  },
  '/comercio': {
    titulo: 'Perú frente a sus competidores',
    puntos: ['Ventanas de exportación de cada país', 'Transporte aéreo y marítimo por destino', 'Orgánico frente a convencional'],
  },
  '/informe': {
    titulo: 'Un informe listo para presentar',
    puntos: ['Resumen del cultivo o de una variedad', 'Con tu empresa en la portada', 'Descarga en PDF en una hoja A4'],
  },
};

export interface PerfilDef {
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
  /** página al iniciar sesión */
  inicio: string;
  /** módulos que suben al grupo "Para ti" del menú */
  paraTi: string[];
}

export const PERFILES: Record<PerfilUsuario, PerfilDef> = {
  exportador: {
    nombre: 'Exportador',
    descripcion: 'A quién vender, cuándo y sin rematar el precio.',
    icon: Ship,
    inicio: '/inteligencia',
    paraTi: ['/inteligencia', '/ranking', '/envios'],
  },
  importador: {
    nombre: 'Importador',
    descripcion: 'Qué campos y exportadores tienen la variedad que buscas.',
    icon: Building2,
    inicio: '/campos',
    paraTi: ['/campos', '/trazabilidad', '/envios'],
  },
  licenciatario: {
    nombre: 'Licenciatario de variedad',
    descripcion: 'Dónde está tu variedad, quién la mueve y cómo se comporta.',
    icon: Sprout,
    inicio: '/inteligencia?vista=variedades',
    paraTi: ['/inteligencia', '/trazabilidad', '/campos'],
  },
  general: {
    nombre: 'Cliente general',
    descripcion: 'Vista completa del mercado, sin un enfoque fijo.',
    icon: Globe,
    inicio: '/',
    paraTi: ['/', '/envios', '/informe'],
  },
  analista: {
    nombre: 'Analista o sector público',
    descripcion: 'Volúmenes, tendencias y mercados.',
    icon: BarChart3,
    inicio: '/',
    paraTi: ['/', '/envios', '/comercio'],
  },
};

export const ORDEN_PERFILES = Object.keys(PERFILES) as PerfilUsuario[];