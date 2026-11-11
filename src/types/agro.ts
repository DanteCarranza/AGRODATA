export type CropId = 'uva' | 'palta' | 'arandano' | 'mango' | 'limon';

export interface Periodo {
  anio: number | null; // null = todos los años
  mesIni: number; // 1-12
  mesFin: number; // 1-12 (puede ser menor que mesIni: rango que cruza el año, ej. Oct–Mar)
}

export interface DashboardParams extends Periodo {
  crop: CropId;
  destino: string | null;
}

export interface Conteo {
  n: string;
  envios: number;
  t?: number;
  /** cambio de participación en puntos porcentuales frente al periodo anterior */
  delta_pp?: number | null;
}

export interface Ranking {
  n: string;
  envios: number;
  t: number;
  destinos: number;
  /** % del volumen (t) del filtro actual */
  share?: number;
  delta_pp?: number | null;
}

export type TipoHallazgo = 'mercado_sube' | 'mercado_baja' | 'exportador_sube' | 'variedad_sube' | 'pico' | 'concentracion';

/**
 * Dato estructurado; el frontend arma la frase. Para 'pico' antes/ahora son meses (1-12);
 * para el resto son % de participación en toneladas.
 */
export interface Hallazgo {
  tipo: TipoHallazgo;
  /** entidad de la que habla (país, empresa, variedad); vacío en 'pico' y 'concentracion' */
  sujeto: string;
  antes: number;
  ahora: number;
}

export interface Comparativo {
  actual: string; // "ago 2025 – jul 2026"
  anterior: string;
  hallazgos: Hallazgo[];
}

export interface CeldaCalendario {
  anio: number;
  mes: number;
  t: number;
  envios: number;
}

export interface DashboardData {
  kpis: { envios: number; peso_t: number; campos: number; destinos: number; traza_pct: number };
  /** true cuando los indicadores salen de la muestra filtrada y no del total oficial */
  muestra: boolean;
  anios: number[];
  calendario: CeldaCalendario[];
  destinos: Conteo[];
  variedades: Conteo[];
  exportadores: Ranking[];
  importadores: Ranking[];
  /** último mes con datos cargados */
  datos_hasta: { anio: number; mes: number };
  /** null cuando no hay un periodo anterior comparable */
  comparativo: Comparativo | null;
}

/* ---------- Sesión ---------- */

/** Tipo de usuario elegido al registrarse: ordena el menú y define la página de inicio */
export type PerfilUsuario = 'exportador' | 'importador' | 'licenciatario' | 'general' | 'analista';

export interface Sesion {
  nombre: string;
  correo: string;
  empresa: string;
  perfil: PerfilUsuario;
  plan: PlanId;
  /** true durante la prueba gratis */
  prueba: boolean;
  /** cultivos contratados (Enterprise: los 5) */
  cultivos: CropId[];
  /** fecha ISO de vencimiento de la suscripción */
  vence: string;
  /** primer año consultable por cultivo según campañas incluidas o compradas; sin entrada = sin límite */
  historial_desde: Partial<Record<CropId, number>>;
}

export interface LoginBody { correo: string; clave: string; recordar: boolean }
export interface RegistroBody {
  nombre: string; empresa: string; correo: string; clave: string;
  perfil: PerfilUsuario; cultivo: CropId;
}

/* ---------- Envíos ---------- */

export type OrdenEnvios = 'fecha' | 'exportador' | 'importador' | 'peso' | 'traza' | 'destino';

/** completa: los campos declaran ≥ lo embarcado; parcial: menos; sin: ningún campo con peso */
export type EstadoTraza = 'completa' | 'parcial' | 'sin';

export interface FiltrosEnvios {
  q: string;
  variedad: string | null;
  destino: string | null;
  exportador: string | null;
  importador: string | null;
  traza: EstadoTraza | null;
  orden: OrdenEnvios;
  dir: 'asc' | 'desc';
}

export interface EnviosParams extends Periodo, FiltrosEnvios {
  crop: CropId;
  offset: number;
  limit: number;
}

export interface CampoEnvio {
  clp: string;
  predio: string | null;
  /** kg que aportó este campo al envío */
  kg: number | null;
}

export interface Envio {
  id: string;
  exp: string; // número de expediente / certificado
  anio: number;
  mes: number;
  /** semana ISO; llegará cuando el backend tenga la fecha exacta de inspección */
  semana?: number;
  exportador: string;
  importador: string;
  variedad: string;
  peso_kg: number;
  /** suma de lo aportado por los campos (puede faltar) */
  aporte_kg: number | null;
  destino: string;
  origen: string;
  planta: string;
  planta_cod: string;
  campos: CampoEnvio[];
}

export interface EnviosPage {
  total: number;
  resumen: {
    peso_kg: number;
    aporte_kg: number;
    exportadores: number;
    importadores: number;
    /** envíos por estado de trazabilidad (calculado sin aplicar el filtro de trazabilidad) */
    traza: Record<EstadoTraza, number>;
    /** toneladas por mes del año (índice 0 = enero) del conjunto filtrado */
    por_mes: number[];
  };
  facetas: { variedades: Conteo[]; destinos: Conteo[] };
  filas: Envio[];
  siguiente: number | null;
}

/* ---------- Campos ---------- */

/** A cuántos exportadores vende el campo: 1, de 2 a 3, 4 o más */
export type Compradores = 'uno' | 'pocos' | 'muchos';
export type OrdenCampos = 'toneladas' | 'envios' | 'exportadores' | 'uso' | 'clp';

export interface FiltrosCampos {
  q: string;
  region: string | null;
  variedad: string | null;
  compradores: Compradores | null;
  orden: OrdenCampos;
  dir: 'asc' | 'desc';
}

export interface CamposParams extends Periodo, FiltrosCampos {
  crop: CropId;
  offset: number;
  limit: number;
}

export interface CampoFila {
  clp: string;
  predio: string | null;
  productor: string | null;
  region: string | null;
  variedad: string | null;
  exportador_principal: string | null;
  exportadores: number;
  envios: number;
  t: number;
  /** % de la capacidad de la campaña ya exportado; null si no hay área ni rendimiento certificados */
  uso_pct: number | null;
  gps: boolean;
}

export interface CamposPage {
  total: number;
  resumen: {
    t: number;
    exportadores: number;
    regiones: { n: string; campos: number; t: number }[];
    /** campos por cantidad de compradores (sin aplicar ese filtro) */
    compradores: Record<Compradores, number>;
  };
  facetas: { regiones: Conteo[]; variedades: Conteo[] };
  filas: CampoFila[];
  siguiente: number | null;
}

export interface FichaCampo {
  clp: string;
  predio: string | null;
  productor: string | null;
  ubicacion: {
    region: string | null;
    provincia: string | null;
    distrito: string | null;
    sector: string | null;
    direccion: string | null;
    /** 'certificado' = dato oficial del campo; 'envios' = región más frecuente en sus envíos */
    fuente: 'certificado' | 'envios' | null;
  };
  gps: { lat: number; lng: number } | null;
  certificacion: {
    area_ha: number | null;
    rend_t_ha: number | null;
    capacidad_t: number | null;
    exportado_campana_t: number | null;
    variedades: { v: string; ha: number | null }[];
  } | null;
  /** participación de cada exportador en lo que sale del campo (%) */
  compradores: { n: string; share: number }[];
  envios: number;
  t: number;
  mensual: number[];
  destinos: { n: string; kg: number }[];
  ultimo: { anio: number; mes: number } | null;
}

/* ---------- Importadores ---------- */

/** Cómo cambió su participación en las compras del cultivo frente al periodo anterior */
export type Tendencia = 'crece' | 'estable' | 'cae' | 'nuevo' | 'inactivo';
export type OrdenImportadores = 'toneladas' | 'envios' | 'tendencia' | 'proveedores' | 'nombre';

export interface FiltrosImportadores {
  q: string;
  pais: string | null;
  variedad: string | null;
  tendencia: Tendencia | null;
  orden: OrdenImportadores;
  dir: 'asc' | 'desc';
}

export interface ImportadoresParams extends Periodo, FiltrosImportadores {
  crop: CropId;
  offset: number;
  limit: number;
}

export interface ImportadorFila {
  n: string;
  pais: string;
  t: number;
  envios: number;
  /** % de las toneladas del cultivo en el periodo */
  share: number;
  variedad: string | null;
  /** % de sus compras que es esa variedad */
  variedad_share: number;
  /** toneladas por mes del año (índice 0 = enero) */
  meses: number[];
  proveedores: number;
  tendencia: Tendencia | null;
  /** cambio de participación en puntos porcentuales */
  delta_pp: number | null;
}

export interface ImportadoresPage {
  total: number;
  /** periodos que se comparan para la tendencia; null si no hay datos suficientes */
  comparativo: { actual: string; anterior: string } | null;
  resumen: {
    t: number;
    paises: { n: string; importadores: number; t: number }[];
      /** importadores por tendencia (sin aplicar ese filtro) */
      tendencias: Record<Tendencia, number>;
      /** importadores con muy pocos envíos para clasificar su tendencia */
      sin_clasificar: number;
      /** los 3 que más compran (por toneladas, sin importar el orden elegido) */
      top: ImportadorFila[];
      /** % de las toneladas filtradas que compra cada uno de los 10 primeros */
      top10: number[];
    };
  facetas: { paises: Conteo[]; variedades: Conteo[] };
  filas: ImportadorFila[];
  siguiente: number | null;
}

export interface CampoSugerido {
  clp: string;
  predio: string | null;
  region: string | null;
  t: number;
  exportador_principal: string | null;
  uso_pct: number | null;
}

export interface FichaImportador {
  nombre: string;
  pais: string;
  t: number;
  envios: number;
  share: number;
  meses: number[];
  /** participación en las compras del cultivo por año (%) */
  por_anio: { anio: number; share: number }[];
  variedades: { n: string; share: number }[];
  proveedores: { n: string; share: number; envios: number }[];
  /** campos con su variedad preferida que hoy no le venden */
  campos_sugeridos: CampoSugerido[];
  tendencia: Tendencia | null;
  delta_pp: number | null;
  /** contacto corporativo verificado; null mientras no exista */
  contacto: { web: string | null; email: string | null; telefono: string | null; linkedin: string | null; verificado: string } | null;
}

export interface FichaExportador {
  nombre: string;
  envios: number;
  peso_kg: number;
  /** kg por mes (índice 0 = enero) */
  mensual: number[];
  destinos: { n: string; kg: number }[];
  importadores: { n: string; kg: number }[];
  campos: { clp: string; predio: string | null; kg: number; kg_total_campo: number }[];
}




/* ---------- Trazabilidad ---------- */

/** Eslabones de la cadena, en el orden en que viaja la fruta */
export type Eslabon = 'campo' | 'planta' | 'exportador' | 'importador' | 'destino';

export interface TrazabilidadParams extends Periodo {
  crop: CropId;
}

export interface TrazaExportador {
  n: string;
  t: number;
  envios: number;
  /** % del peso embarcado por estado de trazabilidad */
  completa: number;
  parcial: number;
  sin: number;
  campos: number;
  plantas: number;
}

export interface TrazabilidadData {
  resumen: {
    envios: number;
    peso_t: number;
    /** toneladas respaldadas por algún campo */
    respaldado_t: number;
    estados: Record<EstadoTraza, { envios: number; t: number }>;
    campos: number;
    plantas: number;
  };
  /** % del peso por estado, año a año (respeta el rango de meses) */
  por_anio: { anio: number; t: number; completa: number; parcial: number; sin: number }[];
  /** región de origen -> variedad -> destino, en toneladas respaldadas por campo */
  flujo: {
    nodos: { id: string; n: string; col: 0 | 1 | 2 }[];
    enlaces: { a: string; b: string; t: number }[];
  };
  exportadores: TrazaExportador[];
  /** puntos de partida para el rastreador */
  sugeridos: { tipo: Eslabon; n: string; detalle: string | null }[];
}

export interface CadenaNodo {
  n: string;
  /** predio y región del campo, código de la planta */
  detalle: string | null;
  t: number;
  envios: number;
  /** true en el nodo "Sin campo enlazado" */
  sin_campo?: boolean;
}

export interface Cadena {
  foco: { tipo: Eslabon; n: string; detalle: string | null };
  t: number;
  envios: number;
  /** % del peso con campo de origen enlazado */
  cobertura: number;
  columnas: Record<Eslabon, CadenaNodo[]>;
}





/* ---------- Balance y compliance ---------- */

/** Semáforo del certificado: qué parte de lo certificado ya se embarcó */
export type EstadoSaldo = 'alto' | 'uso' | 'agotado' | 'sobregiro';
export type OrdenBalance = 'saldo' | 'uso' | 'certificado';

export interface FiltrosBalance {
  q: string;
  region: string | null;
  estado: EstadoSaldo | null;
  orden: OrdenBalance;
}

export interface BalanceParams extends FiltrosBalance {
  crop: CropId;
}

export interface BalanceCampo {
  clp: string;
  predio: string | null;
  productor: string | null;
  region: string | null;
  variedades: { v: string; ha: number | null }[];
  area_ha: number | null;
  rend_t_ha: number | null;
  /** lo que el certificado permite exportar en la campaña (t) */
  certificado_t: number;
  /** lo embarcado bajo ese código en la campaña (t) */
  embarcado_t: number;
  /** certificado - embarcado; negativo es sobregiro */
  saldo_t: number;
  uso_pct: number;
  estado: EstadoSaldo;
  /** fechas de inicio y fin de actividad del certificado, cuando se conocen */
  vigencia: { ini: string; fin: string; vencido: boolean } | null;
  exportador_principal: string | null;
}

export interface BalanceData {
  /** false cuando el cultivo todavía no tiene certificados cargados */
  disponible: boolean;
  campana: string | null;
  resumen: {
    campos: number;
    certificado_t: number;
    embarcado_t: number;
    saldo_t: number;
    /** campos por estado (sin aplicar ese filtro) */
    estados: Record<EstadoSaldo, number>;
    vencidos: number;
  };
  regiones: Conteo[];
  /** campos con más saldo (fruta certificada sin embarcar) */
  oportunidades: BalanceCampo[];
  /** sobregiros y casi agotados */
  alertas: BalanceCampo[];
  filas: BalanceCampo[];
}




/* ---------- Inteligencia ---------- */

export type VistaIntel = 'oportunidades' | 'saturacion' | 'variedades';

export interface IntelParams {
  crop: CropId;
  /** solo se usa el año: para leer una temporada hace falta el año completo */
  anio: number | null;
}

export interface OportunidadImportador {
  n: string;
  pais: string;
  variedad: string | null;
  /** toneladas por mes del año (0 = enero) */
  meses: number[];
  /** % de sus compras del año que caen en la ventana que viene */
  pct_ventana: number;
  /** toneladas que suele comprar en esa ventana */
  t_ventana: number;
  /** mes en que más compra (0-11) */
  mes_pico: number;
  /** meses que faltan para su mes pico (0 = este mes) */
  faltan: number;
  t: number;
  envios: number;
  proveedores: number;
}

export interface IntelOportunidades {
  /** meses de la ventana (0-11), empezando por el actual */
  ventana: number[];
  importadores: OportunidadImportador[];
  paises: { n: string; importadores: number; t_ventana: number }[];
}

export interface SaturacionDestino {
  n: string;
  t: number;
  /** % de lo que recibe en el año que llega cada mes */
  meses: number[];
  /** exportadores peruanos distintos que le enviaron en cada mes */
  exportadores: number[];
  /** meses en que recibe al menos 1,5 veces el promedio */
  llenos: number[];
}

export interface IntelSaturacion {
  /** % del año que sale de Perú cada mes (todo el cultivo) */
  peru: number[];
  destinos: SaturacionDestino[];
}

export interface VariedadIntel {
  n: string;
  t: number;
  /** % de las toneladas del cultivo en el periodo */
  share: number;
  /** cambio de participación en puntos frente al periodo anterior */
  delta_pp: number | null;
  meses: number[];
  destino_principal: string | null;
  importadores: number;
}

export interface IntelVariedades {
  comparativo: { actual: string; anterior: string } | null;
  variedades: VariedadIntel[];
}

export interface DetalleVariedad {
  n: string;
  comparativo: { actual: string; anterior: string } | null;
  /** % de la temporada que sale cada mes, en cada periodo */
  meses_actual: number[];
  meses_anterior: number[] | null;
  destinos: { n: string; share: number }[];
  importadores: { n: string; pais: string; t: number }[];
  exportadores: { n: string; t: number }[];
  campos: number;
}




/* ---------- Comercio internacional ---------- */

export type ModoTransporte = 'MARITIMO' | 'AEREO' | 'TERRESTRE';

export interface ComercioData {
  /** totales de la base oficial completa (no de la muestra) */
  totales: { envios: number; peso_t: number; destinos: number; campos: number };
  partida: { codigo: string; descripcion: string } | null;
  /** destinos por número de envíos en la base oficial */
  destinos: { n: string; envios: number; share: number }[];
  calendario: {
    /** % del año que Perú embarca cada mes (0 = enero) */
    peru: number[];
    /** ventanas de exportación de otros orígenes (referencia del sector) */
    competidores: { pais: string; meses: number[] }[];
  };
  /** null mientras ese cultivo no tenga procesado el medio de transporte */
  transporte: {
    modos: { k: ModoTransporte; pct: number }[];
    por_destino: { n: string; modos: Partial<Record<ModoTransporte, number>> }[];
  } | null;
  /** null mientras ese cultivo no tenga procesada la marca de orgánico */
  organico: {
    pct_volumen: number;
    envios_organicos: number;
    envios_convencionales: number;
    exportadores_organicos: number;
    exportadores_total: number;
  } | null;
}





/* ---------- Acceso a mercados ---------- */

export interface Requisito {
  /** "verificado": viene de la fuente oficial; "referencial": falta confirmarlo */
  estado: 'verificado' | 'referencial';
  fuente: string;
  /** fecha ISO de la última verificación, si existe */
  verificado: string | null;
}

export interface AccesoData {
  destino: string;
  /** bloque cuyos requisitos aplican (ej. Países Bajos -> Unión Europea) */
  rige: string | null;
  /** mercados entre los que se puede elegir, con su número de envíos en la base oficial */
  destinos: { n: string; envios: number }[];
  /** lo que Perú ya exporta a ese mercado; null si no hay envíos */
  comercio: { envios: number; share: number; exportadores: number; desde: number | null } | null;
  fitosanitario: (Requisito & {
    certificado: boolean;
    categoria: number | null;
    tratamientos: string[];
    declaraciones: string[];
    inspeccion: string | null;
  }) | null;
  lmr: {
    norma: string;
    /** límites por plaguicida; vacío mientras no se cargue la base de LMR */
    analitos: { analito: string; limite: number; unidad: string; codex: number | null }[];
  };
  otros: (Requisito & { texto: string })[];
}




/* ---------- Alertas sanitarias (RASFF) y fitosanitarias (EUROPHYT) ---------- */

export type TipoAlerta = 'sanitaria' | 'fitosanitaria';
export type CategoriaAlerta =
  | 'plaguicidas' | 'metales' | 'microbiologia' | 'contaminantes'
  | 'insectos' | 'enfermedades' | 'cuarentena' | 'otros';

export interface Alerta {
  id: string;
  /** fecha ISO de la notificación */
  fecha: string;
  producto: string;
  /** cultivo de la plataforma al que corresponde, si aplica */
  cultivo: CropId | null;
  /** sustancia, microorganismo o plaga */
  peligro: string;
  categoria: CategoriaAlerta;
  /** país que notifica, en mayúsculas como el resto de la data */
  notificante: string;
  /** tipo tal como lo publica la fuente: rechazo en frontera, alerta, intercepción... */
  tipo: string;
  gravedad: 'alta' | 'media' | 'baja';
  /** número de referencia en la fuente oficial */
  referencia: string | null;
  enlace: string | null;
  /** true en la vista previa con ejemplos del prototipo */
  ejemplo: boolean;
}

export interface AlertasParams {
  tipo: TipoAlerta;
  crop: CropId;
  /** false: todos los productos peruanos; true: solo el cultivo activo */
  soloCultivo: boolean;
  pais: string | null;
}

export interface AlertasData {
  fuente: { nombre: string; url: string; actualizado: string | null };
  /** false mientras la fuente real no esté conectada (se muestran ejemplos) */
  conectado: boolean;
  alertas: Alerta[];
  resumen: {
    total: number;
    del_cultivo: number;
    paises: Conteo[];
    categorias: { k: CategoriaAlerta; n: number }[];
  };
}




/* ---------- Informe visual ---------- */

export interface InformeParams extends Periodo {
  crop: CropId;
  /** null: informe de todo el cultivo */
  variedad: string | null;
}

export interface InformeData {
  variedad: string | null;
  /** para el selector, ordenadas por toneladas */
  variedades_disponibles: string[];
  t: number;
  envios: number;
  exportadores: number;
  importadores: number;
  destinos_n: number;
  variedades_n: number;
  /** toneladas por mes (0 = enero) */
  meses: number[];
  variedades: { n: string; t: number }[];
  destinos: { n: string; t: number }[];
  importadores_top: { n: string; pais: string; t: number }[];
  /** solo en el informe de una variedad */
  exportadores_top: { n: string; t: number }[];
  campos: { clp: string; predio: string | null; region: string | null; t: number }[];
  /** variedad que más participación ganó frente al periodo anterior (solo informe del cultivo) */
  gana_terreno: { n: string; delta_pp: number; comparativo: string } | null;
}




/* ---------- Suscripción ---------- */

export type PlanId = 'esencial' | 'profesional' | 'enterprise';
export type Facturacion = 'mensual' | 'anual';

export interface PlanCatalogo {
  id: PlanId;
  nombre: string;
  lema: string;
  destacado: boolean;
  /** tarifas mensuales en US$ sin IGV; el pago anual cobra 10 meses */
  tarifas: { etiqueta: string; cultivos: number; mensual: number; desde?: boolean }[];
  actualizacion: string;
  incluye: { t: string; nivel: 'si' | 'parcial' | 'no' }[];
}

/** true: incluido · false: no incluido · texto: incluido con matiz ("hasta 3", "Vista") */
export type ValorComparacion = boolean | string;

export interface GrupoComparacion {
  grupo: string;
  filas: { funcion: string; valores: Record<PlanId, ValorComparacion> }[];
}

export interface CuentaSuscripcion {
  empresa: string;
  plan: PlanId;
  cultivos: CropId[];
  facturacion: Facturacion;
  /** fechas ISO del periodo pagado */
  inicio: string;
  vence: string;
  /** true durante la prueba gratis */
  prueba: boolean;
  /** importe del siguiente periodo, US$ sin IGV */
  monto_usd: number;
  actualizacion: string;
}

export type EstadoCampana = 'en_curso' | 'incluida' | 'desbloqueada' | 'solicitada' | 'bloqueada';

export interface CampanaHistorica {
  id: string;
  etiqueta: string;
  ventana: string;
  estado: EstadoCampana;
  /** solo en bloqueada: pago único, US$ sin IGV */
  precio_usd: number | null;
}

export interface SuscripcionData {
  cuenta: CuentaSuscripcion;
  planes: PlanCatalogo[];
  comparacion: GrupoComparacion[];
  campanas: {
    crop: CropId;
    /** el cultivo está en el plan del cliente */
    incluido: boolean;
    ventana: string;
    ventana_estimada: boolean;
    lista: CampanaHistorica[];
  };
}

export type TipoSolicitud = 'renovacion' | 'cambio_plan' | 'campana' | 'agregar_cultivo';

export interface SolicitudSuscripcion {
  tipo: TipoSolicitud;
  plan?: PlanId;
  facturacion?: Facturacion;
  crop?: CropId;
  campana?: string;
}

export interface RespuestaSolicitud {
  ok: boolean;
  mensaje: string;
}