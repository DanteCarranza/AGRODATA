import {
    LayoutDashboard, Ship, Trophy, MapPinned, Route, Scale, LineChart, FileBarChart,
    Globe2, ShieldCheck, Siren, Bug, CreditCard, type LucideIcon,
  } from 'lucide-react';
  
  export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    /** true cuando el módulo ya está migrado al nuevo frontend */
    listo?: boolean;
  }
  export interface NavGroup {
    titulo: string;
    items: NavItem[];
  }
  
  export const NAV: NavGroup[] = [
    {
      titulo: 'Explorar',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, listo: true },
        { to: '/envios', label: 'Envíos', icon: Ship, listo: true },
        { to: '/ranking', label: 'Ranking de importadores', icon: Trophy, listo: true },
        { to: '/campos', label: 'Campos', icon: MapPinned, listo: true },
      ],
    },
    {
      titulo: 'Cadena',
      items: [
        { to: '/trazabilidad', label: 'Trazabilidad', icon: Route, listo: true },
        { to: '/balance', label: 'Balance y compliance', icon: Scale, listo: true },
      ],
    },
    {
      titulo: 'Mercado',
      items: [
        { to: '/inteligencia', label: 'Inteligencia', icon: LineChart, listo: true },
        { to: '/comercio', label: 'Comercio internacional', icon: Globe2, listo: true },
        { to: '/acceso', label: 'Acceso a mercados', icon: ShieldCheck, listo: true },
        { to: '/alertas-sanitarias', label: 'Alertas sanitarias', icon: Siren, listo: true },
        { to: '/alertas-fitosanitarias', label: 'Alertas fitosanitarias', icon: Bug, listo: true },
      ],
    },
    {
      titulo: 'Reportes y cuenta',
      items: [
        { to: '/informe', label: 'Informe visual', icon: FileBarChart, listo: true },
        { to: '/suscripcion', label: 'Suscripción', icon: CreditCard, listo: true },
      ],
    },
  ];
  
  export const NAV_FLAT = NAV.flatMap((g) => g.items);


  
/** Menú según el tipo de usuario: sus tres módulos clave suben al grupo "Para ti" */
export function navPara(paraTi: string[]): NavGroup[] {
  const primeros = paraTi.map((to) => NAV_FLAT.find((n) => n.to === to)).filter((n): n is NavItem => !!n);
  return [
    { titulo: 'Para ti', items: primeros },
    ...NAV.map((g) => ({ ...g, items: g.items.filter((i) => !paraTi.includes(i.to)) })).filter((g) => g.items.length),
  ];
}