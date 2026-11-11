import { Biohazard, Bug, FlaskConical, Leaf, Microscope, ShieldAlert, Sprout, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { CategoriaAlerta, TipoAlerta } from '@/types/agro';

export const CATEGORIA: Record<CategoriaAlerta, { l: string; icono: LucideIcon }> = {
  plaguicidas: { l: 'Plaguicidas', icono: FlaskConical },
  metales: { l: 'Metales pesados', icono: TriangleAlert },
  microbiologia: { l: 'Microbiología', icono: Microscope },
  contaminantes: { l: 'Otros contaminantes', icono: Biohazard },
  insectos: { l: 'Insectos', icono: Bug },
  enfermedades: { l: 'Hongos y enfermedades', icono: Leaf },
  cuarentena: { l: 'Plagas cuarentenarias', icono: ShieldAlert },
  otros: { l: 'Otros', icono: Sprout },
};

/** Textos de cada página: la misma pantalla sirve para lo sanitario y lo fitosanitario */
export const TIPO: Record<TipoAlerta, {
  ruta: string;
  kicker: string;
  titulo: [string, string];
  bajada: string;
  queEs: string;
  peligro: string;
  premium: string;
}> = {
  sanitaria: {
    ruta: '/alertas-sanitarias',
    kicker: 'Alertas sanitarias · RASFF',
    titulo: ['Lo que Europa ', 'rechaza'],
    bajada:
      'Notificaciones de la Unión Europea sobre alimentos peruanos: residuos de plaguicidas, metales pesados, microorganismos y otros contaminantes. Para saber qué se está rechazando y anticiparte.',
    queEs:
      'El RASFF es el sistema de alerta rápida de la UE para alimentos y piensos. Cada vez que un país miembro detecta un riesgo en un producto, lo notifica ahí y queda público.',
    peligro: 'Sustancia o riesgo',
    premium:
      'Al cruzar cada notificación con la información pública de la autoridad sanitaria peruana se podrá ver qué exportador estaba detrás, el destino, la cantidad y qué pasó con la mercadería.',
  },
  fitosanitaria: {
    ruta: '/alertas-fitosanitarias',
    kicker: 'Alertas fitosanitarias · EUROPHYT',
    titulo: ['Plagas interceptadas ', 'en destino'],
    bajada:
      'Intercepciones de plagas y organismos de cuarentena en fruta peruana que llega a la Unión Europea. Junto con las alertas sanitarias, completan la foto de por qué se frena un embarque.',
    queEs:
      'EUROPHYT (hoy dentro de TRACES) registra las intercepciones de plagas en productos vegetales que entran a la UE. Cada caso indica el producto, la plaga, el país que la detectó y la medida tomada.',
    peligro: 'Plaga u organismo',
    premium:
      'Al cruzar cada intercepción con la información pública de la autoridad fitosanitaria se podrá ver el exportador, el campo de origen y qué pasó con la mercadería, cerrando el círculo con la trazabilidad.',
  },
};