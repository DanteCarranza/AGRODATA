/** Código ISO de dos letras de los destinos tal como vienen en la data (en mayúsculas y sin tildes) */
const ISO: Record<string, string> = {
    EEUU: 'US', 'ESTADOS UNIDOS': 'US', 'PAISES BAJOS': 'NL', HOLANDA: 'NL', CHILE: 'CL', ESPAÑA: 'ES', ESPANA: 'ES',
    CHINA: 'CN', MEXICO: 'MX', COLOMBIA: 'CO', PANAMA: 'PA', CANADA: 'CA', RUSIA: 'RU', 'COREA DEL SUR': 'KR',
    INDIA: 'IN', JAPON: 'JP', 'REINO UNIDO': 'GB', INGLATERRA: 'GB', ISRAEL: 'IL', SINGAPUR: 'SG',
    'REPUBLICA DOMINICANA': 'DO', GUATEMALA: 'GT', FRANCIA: 'FR', 'COSTA RICA': 'CR', BRASIL: 'BR', ARGENTINA: 'AR',
    TAIWAN: 'TW', TAILANDIA: 'TH', HONDURAS: 'HN', ALEMANIA: 'DE', 'EL SALVADOR': 'SV', 'PUERTO RICO': 'PR',
    ITALIA: 'IT', ECUADOR: 'EC', MARRUECOS: 'MA', 'HONG KONG': 'HK', 'NUEVA ZELANDA': 'NZ', BELGICA: 'BE',
    VENEZUELA: 'VE', PORTUGAL: 'PT', TURQUIA: 'TR', DUBAI: 'AE', 'EMIRATOS ARABES UNIDOS': 'AE',
    'REINO DE ARABIA SAUDITA': 'SA', 'ARABIA SAUDITA': 'SA', MARTINICA: 'MQ', POLONIA: 'PL', GUADALUPE: 'GP',
    GRECIA: 'GR', SUIZA: 'CH', NICARAGUA: 'NI', LITUANIA: 'LT', 'GUYANA FRANCESA': 'GF', VIETNAM: 'VN',
    UCRANIA: 'UA', LIBANO: 'LB', BIELORUSIA: 'BY', MALASIA: 'MY', QATAR: 'QA', JORDANIA: 'JO',
    PERU: 'PE', SUDAFRICA: 'ZA',
  };
  
  /** Nombres con tildes y forma correcta (la data viene en mayúsculas y sin tildes) */
  const NOMBRES: Record<string, string> = {
    EEUU: 'EE. UU.', 'PAISES BAJOS': 'Países Bajos', MEXICO: 'México', PANAMA: 'Panamá', CANADA: 'Canadá',
    JAPON: 'Japón', BELGICA: 'Bélgica', TURQUIA: 'Turquía', LIBANO: 'Líbano', BIELORUSIA: 'Bielorrusia',
    TAIWAN: 'Taiwán', 'REPUBLICA DOMINICANA': 'República Dominicana', 'EMIRATOS ARABES UNIDOS': 'Emiratos Árabes Unidos',
    'REINO DE ARABIA SAUDITA': 'Arabia Saudita', MARTINICA: 'Martinica', 'COREA DEL SUR': 'Corea del Sur',
    'NUEVA ZELANDA': 'Nueva Zelanda', 'HONG KONG': 'Hong Kong', 'GUYANA FRANCESA': 'Guayana Francesa',
    PERU: 'Perú', SUDAFRICA: 'Sudáfrica', 'UNION EUROPEA': 'Unión Europea',
  };
  
  /** "PAISES BAJOS" -> "Países Bajos"; si no está en la lista, solo pasa a tipo título */
  export const nombrePais = (n: string) =>
    NOMBRES[n.trim().toUpperCase()] ?? n.trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  
  export const codigoPais = (n: string): string | null => ISO[n.trim().toUpperCase()] ?? null;