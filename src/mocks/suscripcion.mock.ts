/**
 * Implementación en el navegador de:
 *   GET  /api/suscripcion?crop                -> SuscripcionData
 *   POST /api/suscripcion/solicitudes  {body}  -> RespuestaSolicitud
 *
 * Planes, tarifas y comparación vienen del prototipo (precios en US$ sin IGV; el pago anual cobra 10 meses).
 * La cuenta es la conectada en cuentas.mock. En producción el backend registra la solicitud
 * y el área comercial confirma el pago; aquí solo queda marcada en la cuenta de demostración.
 */
import type {
    CropId, CuentaSuscripcion, GrupoComparacion, PlanCatalogo, RespuestaSolicitud, SolicitudSuscripcion, SuscripcionData,
  } from '@/types/agro';
  import { MESES_LARGO, cropById } from '@/config/crops';
  import { VENTANA, campanasDe, cuentaActual, guardarCuenta } from './cuentas.mock';
  
  const PLANES: PlanCatalogo[] = [
    {
      id: 'esencial',
      nombre: 'Esencial',
      lema: 'Para leer el mercado y a tu competencia.',
      destacado: false,
      tarifas: [
        { etiqueta: '1 cultivo', cultivos: 1, mensual: 130 },
        { etiqueta: '3 cultivos', cultivos: 3, mensual: 200 },
        { etiqueta: 'Todos los cultivos', cultivos: 5, mensual: 250 },
      ],
      actualizacion: 'cada 10 días como máximo',
      incluye: [
        { t: 'Dashboard de mercado y rankings', nivel: 'si' },
        { t: 'Envíos filtrables y descarga en Excel', nivel: 'si' },
        { t: 'Directorio de campos certificados', nivel: 'si' },
        { t: 'Trazabilidad destino → empresa', nivel: 'parcial' },
        { t: 'Trazabilidad completa hasta el campo', nivel: 'no' },
        { t: 'Balance de saldos y compliance', nivel: 'no' },
        { t: 'Inteligencia por variedad', nivel: 'no' },
      ],
    },
    {
      id: 'profesional',
      nombre: 'Profesional',
      lema: 'Trazabilidad completa y oportunidad comercial.',
      destacado: true,
      tarifas: [
        { etiqueta: '1 cultivo', cultivos: 1, mensual: 290 },
        { etiqueta: '3 cultivos', cultivos: 3, mensual: 450 },
        { etiqueta: 'Todos los cultivos', cultivos: 5, mensual: 580 },
      ],
      actualizacion: 'semanal',
      incluye: [
        { t: 'Todo lo de Esencial', nivel: 'si' },
        { t: 'Trazabilidad campo ↔ exportador ↔ destino', nivel: 'si' },
        { t: 'Balance de saldos por campo', nivel: 'si' },
        { t: 'Inteligencia por variedad y oportunidades', nivel: 'si' },
        { t: 'Geolocalización y detalle por variedad', nivel: 'si' },
        { t: 'Alertas de sobregiro (solo vista)', nivel: 'parcial' },
        { t: 'Alertas automáticas y API', nivel: 'no' },
      ],
    },
    {
      id: 'enterprise',
      nombre: 'Enterprise',
      lema: 'Para grandes exportadores y licenciantes de variedades.',
      destacado: false,
      tarifas: [{ etiqueta: 'Todos los cultivos, multiusuario', cultivos: 5, mensual: 800, desde: true }],
      actualizacion: 'cada 3 días o diaria',
      incluye: [
        { t: 'Todo lo de Profesional, en los 5 cultivos', nivel: 'si' },
        { t: 'Compliance de sobregiro completo', nivel: 'si' },
        { t: 'Alertas automáticas por correo', nivel: 'si' },
        { t: 'Vigilancia de variedades protegidas', nivel: 'si' },
        { t: 'Acceso por API y reportes a medida', nivel: 'si' },
        { t: 'Soporte prioritario dedicado', nivel: 'si' },
      ],
    },
  ];
  
  const COMPARACION: GrupoComparacion[] = [
    {
      grupo: 'Cobertura',
      filas: [
        { funcion: 'Cultivos', valores: { esencial: '1, 3 o todos', profesional: '1, 3 o todos', enterprise: 'Todos' } },
        { funcion: 'Actualización de datos', valores: { esencial: 'máx. 10 días', profesional: 'máx. 7 días', enterprise: 'máx. 3 días' } },
        { funcion: 'Campañas anteriores incluidas', valores: { esencial: '–', profesional: '2', enterprise: 'Todas' } },
      ],
    },
    {
      grupo: 'Trazabilidad',
      filas: [
        { funcion: 'Destino → empresa', valores: { esencial: true, profesional: true, enterprise: true } },
        { funcion: 'Cadena completa hasta el campo', valores: { esencial: false, profesional: true, enterprise: true } },
        { funcion: 'Navegación entre campo, exportador e importador', valores: { esencial: false, profesional: true, enterprise: true } },
        { funcion: 'Geolocalización y variedades por campo', valores: { esencial: false, profesional: true, enterprise: true } },
      ],
    },
    {
      grupo: 'Balance y compliance',
      filas: [
        { funcion: 'Balance de saldos', valores: { esencial: false, profesional: true, enterprise: true } },
        { funcion: 'Inteligencia por variedad', valores: { esencial: false, profesional: true, enterprise: true } },
        { funcion: 'Alerta de sobregiro fitosanitario', valores: { esencial: false, profesional: 'Vista', enterprise: true } },
        { funcion: 'Alertas automáticas y API', valores: { esencial: false, profesional: false, enterprise: true } },
      ],
    },
  ];
  
  export async function suscripcionMock({ crop }: { crop: CropId }): Promise<SuscripcionData> {
    const c = cuentaActual();
    const def = PLANES.find((p) => p.id === c.plan)!;
    const tarifa = def.tarifas.find((t) => t.cultivos >= c.cultivos.length) ?? def.tarifas[def.tarifas.length - 1];
  
    const cuenta: CuentaSuscripcion = {
      empresa: c.empresa,
      plan: c.plan,
      cultivos: c.plan === 'enterprise' ? ['uva', 'palta', 'arandano', 'mango', 'limon'] : c.cultivos,
      facturacion: c.facturacion,
      inicio: c.inicio,
      vence: c.vence,
      prueba: c.prueba,
      monto_usd: tarifa.mensual * (c.facturacion === 'anual' ? 10 : 1),
      actualizacion: def.actualizacion,
    };
  
    const incluido = c.plan === 'enterprise' || c.cultivos.includes(crop);
    const { iniM, estimada } = VENTANA[crop];
    return {
      cuenta,
      planes: PLANES,
      comparacion: COMPARACION,
      campanas: {
        crop,
        incluido,
        ventana: `${MESES_LARGO[iniM - 1].toLowerCase()} a ${MESES_LARGO[(iniM + 10) % 12].toLowerCase()}`,
        ventana_estimada: estimada,
        lista: incluido ? campanasDe(crop, c) : [],
      },
    };
  }
  
  export async function solicitudMock(b: SolicitudSuscripcion): Promise<RespuestaSolicitud> {
    await new Promise((r) => setTimeout(r, 500));
    switch (b.tipo) {
      case 'campana': {
        const c = cuentaActual();
        if (b.campana && !c.solicitadas.includes(b.campana)) guardarCuenta({ ...c, solicitadas: [...c.solicitadas, b.campana] });
        return { ok: true, mensaje: `Registramos tu pedido de la campaña ${b.campana?.split(':')[1] ?? ''}. Se activa en cuanto se confirme el pago.` };
      }
      case 'cambio_plan': {
        const p = PLANES.find((x) => x.id === b.plan);
        return {
          ok: true,
          mensaje: b.plan === 'enterprise'
            ? 'Recibimos tu pedido de cotización Enterprise. Te escribiremos para definir el alcance.'
            : `Recibimos tu pedido de cambio al plan ${p?.nombre ?? ''}. Te escribiremos para confirmarlo.`,
        };
      }
      case 'agregar_cultivo':
        return { ok: true, mensaje: `Recibimos tu pedido para agregar ${b.crop ? cropById(b.crop).nombre.toLowerCase() : 'el cultivo'} a tu plan. Te enviaremos la nueva tarifa.` };
      default:
        return { ok: true, mensaje: 'Recibimos tu pedido de renovación. Te enviaremos el comprobante para el pago.' };
    }
  }