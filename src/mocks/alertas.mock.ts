/**
 * Implementación en el navegador de:
 *   GET /api/alertas?tipo&crop&soloCultivo&pais   -> AlertasData
 *
 * Todavía no hay conexión con RASFF ni EUROPHYT: estos son los ejemplos ilustrativos del prototipo,
 * marcados con ejemplo: true y conectado: false. El backend los reemplazará con las notificaciones reales.
 */
import type { Alerta, AlertasData, AlertasParams, CategoriaAlerta, Conteo, TipoAlerta } from '@/types/agro';

const FUENTE: Record<TipoAlerta, AlertasData['fuente']> = {
  sanitaria: { nombre: 'RASFF Window (Unión Europea)', url: 'https://webgate.ec.europa.eu/rasff-window/screen/search', actualizado: null },
  fitosanitaria: { nombre: 'EUROPHYT / TRACES (Unión Europea)', url: 'https://food.ec.europa.eu/plants/plant-health-and-biosecurity/europhyt_en', actualizado: null },
};

const base = { referencia: null, enlace: null, ejemplo: true } as const;

const EJEMPLOS: Record<TipoAlerta, Alerta[]> = {
  sanitaria: [
    { ...base, id: 's1', fecha: '2025-03-12', producto: 'Palta Hass', cultivo: 'palta', peligro: 'Cadmio', categoria: 'metales', notificante: 'ESPAÑA', tipo: 'Rechazo en frontera', gravedad: 'alta' },
    { ...base, id: 's2', fecha: '2025-02-28', producto: 'Arándano', cultivo: 'arandano', peligro: 'Clorpirifós', categoria: 'plaguicidas', notificante: 'PAISES BAJOS', tipo: 'Alerta', gravedad: 'alta' },
    { ...base, id: 's3', fecha: '2025-02-15', producto: 'Uva de mesa', cultivo: 'uva', peligro: 'Residuo de plaguicida sobre el límite', categoria: 'plaguicidas', notificante: 'ALEMANIA', tipo: 'Información', gravedad: 'media' },
    { ...base, id: 's4', fecha: '2025-02-03', producto: 'Jengibre', cultivo: null, peligro: 'Óxido de etileno', categoria: 'contaminantes', notificante: 'ITALIA', tipo: 'Rechazo en frontera', gravedad: 'alta' },
    { ...base, id: 's5', fecha: '2025-01-20', producto: 'Palta', cultivo: 'palta', peligro: 'Listeria monocytogenes', categoria: 'microbiologia', notificante: 'BELGICA', tipo: 'Alerta', gravedad: 'alta' },
  ],
  fitosanitaria: [
    { ...base, id: 'f1', fecha: '2025-03-10', producto: 'Uva de mesa', cultivo: 'uva', peligro: 'Mosca del Mediterráneo (Ceratitis capitata)', categoria: 'insectos', notificante: 'ESPAÑA', tipo: 'Intercepción en frontera', gravedad: 'alta' },
    { ...base, id: 'f2', fecha: '2025-02-22', producto: 'Mandarina', cultivo: null, peligro: 'Falsa polilla del algodonero (Thaumatotibia leucotreta)', categoria: 'insectos', notificante: 'PAISES BAJOS', tipo: 'Intercepción', gravedad: 'alta' },
    { ...base, id: 'f3', fecha: '2025-02-11', producto: 'Palta', cultivo: 'palta', peligro: 'Cochinilla o escama cuarentenaria', categoria: 'cuarentena', notificante: 'ALEMANIA', tipo: 'No conformidad', gravedad: 'media' },
    { ...base, id: 'f4', fecha: '2025-01-30', producto: 'Arándano', cultivo: 'arandano', peligro: 'Trips (Thysanoptera)', categoria: 'insectos', notificante: 'BELGICA', tipo: 'Intercepción', gravedad: 'alta' },
    { ...base, id: 'f5', fecha: '2025-01-18', producto: 'Espárrago', cultivo: null, peligro: 'Organismo de cuarentena', categoria: 'cuarentena', notificante: 'FRANCIA', tipo: 'Intercepción', gravedad: 'media' },
  ],
};

const latencia = () => new Promise((r) => setTimeout(r, 150));

export async function alertasMock(p: AlertasParams): Promise<AlertasData> {
  await latencia();
  const todas = EJEMPLOS[p.tipo];
  const delCultivo = todas.filter((a) => a.cultivo === p.crop);
  const base = p.soloCultivo ? delCultivo : todas;

  const paises = new Map<string, number>();
  base.forEach((a) => paises.set(a.notificante, (paises.get(a.notificante) ?? 0) + 1));
  const alertas = base.filter((a) => !p.pais || a.notificante === p.pais).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const cats = new Map<CategoriaAlerta, number>();
  alertas.forEach((a) => cats.set(a.categoria, (cats.get(a.categoria) ?? 0) + 1));

  return {
    fuente: FUENTE[p.tipo],
    conectado: false,
    alertas,
    resumen: {
      total: alertas.length,
      del_cultivo: delCultivo.length,
      paises: [...paises.entries()].map(([n, envios]): Conteo => ({ n, envios })).sort((a, b) => b.envios - a.envios),
      categorias: [...cats.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n),
    },
  };
}