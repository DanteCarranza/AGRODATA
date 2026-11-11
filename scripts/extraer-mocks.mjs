// Uso: npm run mocks -- "C:\carpeta\donde\esta\prototipo.html"
// Extrae los datos embebidos del prototipo y genera:
//   src/mocks/agro.json    -> resumen por cultivo (dashboard y buscador)
//   src/mocks/envios.json  -> hoja de envíos completa + nombres de predio por CLP
//   src/mocks/campos.json  -> datos fijos de cada campo (ubicación, certificación, exportadores)
import fs from 'node:fs';
import path from 'node:path';

const ruta = process.argv[2];
if (!ruta) {
  console.error('Falta la ruta del prototipo. Ejemplo:\n  npm run mocks -- "C:\\Users\\tu_usuario\\Downloads\\prototipo.html"');
  process.exit(1);
}
if (!fs.existsSync(ruta)) {
  console.error(`No existe el archivo: ${path.resolve(ruta)}\nRevisa la ruta (si tiene espacios, ponla entre comillas).`);
  process.exit(1);
}

let html = fs.readFileSync(ruta);
// Soporta archivos guardados en UTF-16 (algunos editores de Windows lo hacen)
html = html[0] === 0xff && html[1] === 0xfe ? html.toString('utf16le') : html.toString('utf8');

/**
 * Busca `NOMBRE=` en cualquier parte del HTML (con o sin const/var/let, indentado,
 * con saltos de línea Windows o en la misma línea que <script>) y extrae el objeto
 * JSON que sigue contando llaves, respetando el contenido de los strings.
 */
function leer(nombre) {
  const re = new RegExp(`(?:^|[\\s;>])(?:const|var|let)?\\s*${nombre}\\s*=\\s*\\{`, 'm');
  const m = re.exec(html);
  if (!m) throw new Error(`No se encontró ${nombre} en el HTML. ¿Es el prototipo con los datos embebidos?`);
  const inicio = m.index + m[0].length - 1;
  let nivel = 0;
  let enString = false;
  let escape = false;
  for (let i = inicio; i < html.length; i++) {
    const c = html[i];
    if (enString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') enString = false;
      continue;
    }
    if (c === '"') enString = true;
    else if (c === '{') nivel++;
    else if (c === '}' && --nivel === 0) return JSON.parse(html.slice(inicio, i + 1));
  }
  throw new Error(`${nombre} está incompleto en el HTML`);
}

const raw = leer('RAW');
const env = leer('ENVIOS_ALL');
const predios = leer('CLP2PREDIO');
const VAR_COMPLETE = leer('VAR_COMPLETE');
const GRAPH = leer('GRAPH'); // detalle de certificación (hoy solo uva)
const C2E = leer('C2E_ALL'); // exportadores por campo en la base completa

// Misma lógica que varComercial() del prototipo: nombre truncado -> nombre comercial
function varComercial(v) {
  if (!v) return '';
  v = String(v).trim();
  if (VAR_COMPLETE[v]) return VAR_COMPLETE[v];
  const grupos = v.match(/\(([^()]*)/g);
  if (grupos) {
    for (let i = grupos.length - 1; i >= 0; i--) {
      const g = grupos[i].replace(/^\(/, '').trim();
      if (g && !/^[\d\-\s]+$/.test(g)) return g.toUpperCase();
    }
  }
  return (v.replace(/\s*\(.*$/, '').trim() || v).toUpperCase();
}

const agro = {};
const envios = {};
const campos = {};
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

for (const crop of Object.keys(raw.DB)) {
  const db = raw.DB[crop];
  const resumen = [];
  const filas = [];
  const clpsUsados = new Set();

  for (const [exportador, arr] of Object.entries(env[crop] ?? {})) {
    for (const e of arr) {
      const variedad = varComercial(e.var);
      resumen.push({
        a: e.anio, m: e.mes, t: +(e.peso_neto / 1000).toFixed(2),
        d: e.dest, x: exportador, i: e.imp || '', v: variedad,
        k: e.clps.map((c) => c.clp),
      });
      e.clps.forEach((c) => clpsUsados.add(c.clp));
      filas.push({
        id: `${e.exp}-${filas.length}`,
        exp: e.exp, anio: e.anio, mes: e.mes,
        exportador, importador: e.imp || '', variedad,
        peso_kg: e.peso_neto, aporte_kg: e.suma_pu ?? null,
        destino: e.dest || '', origen: e.dep || '',
        planta: e.inst || '', planta_cod: e.cod_inst || '',
        campos: e.clps.map((c) => ({ clp: c.clp, kg: c.pu ?? null })),
      });
    }
  }

  agro[crop] = {
    kpis: { envios: db.envios, campos: db.campos, peso_t: db.peso_t, match: db.match, traza_pct: db.traza_pct },
    anios: [...new Set(resumen.map((e) => e.a))].sort(),
    dest: db.dest,
    vars: db.vars,
    envios: resumen,
  };
  
  
  envios[crop] = {
    filas,
    predios: Object.fromEntries([...clpsUsados].filter((c) => predios[crop]?.[c]).map((c) => [c, predios[crop][c]])),
  };

  // Solo los campos que aparecen en la muestra de envíos: así Campos cuadra con Envíos y el filtro de periodo
  campos[crop] = {};
  const g = GRAPH[crop]?.campo2exp ?? {};
  for (const clp of clpsUsados) {
    const d = g[clp];
    const area = d ? num(d.acer) ?? num(d.asol) : null;
    const rend = d ? num(d.rend) : null;
    const lista = C2E[crop]?.[clp] ?? [];
    const sumaT = lista.reduce((s, x) => s + (x.t || 0), 0) || 1;
    campos[crop][clp] = {
      predio: d?.predio || predios[crop]?.[clp] || null,
      productor: d?.razon || null,
      region: d?.dep || null,
      provincia: d?.prov || null,
      distrito: d?.dist || null,
      sector: d?.sector || null,
      direccion: d?.dir?.trim() || null,
      gps: d && num(d.lat) !== null && num(d.lng) !== null ? { lat: d.lat, lng: d.lng } : null,
      cert: d
        ? {
            area_ha: area,
            rend_t_ha: rend,
            capacidad_t: area && rend ? Math.round(area * rend) : num(d.cert),
            exportado_campana_t: num(d.exp_t),
            variedades: (d.vars ?? []).map((v) => ({ v: varComercial(v.v), ha: num(v.ha) })),
          }
        : null,
      // participación de cada exportador en el campo (las unidades de C2E_ALL no son toneladas reales)
      compradores: lista.map((x) => ({ n: x.n.trim(), share: +((x.t / sumaT) * 100).toFixed(2) })),
    };
  }
}

fs.mkdirSync('src/mocks', { recursive: true });
fs.writeFileSync('src/mocks/agro.json', JSON.stringify(agro));
fs.writeFileSync('src/mocks/envios.json', JSON.stringify(envios));
fs.writeFileSync('src/mocks/campos.json', JSON.stringify(campos));



console.log('Mocks generados:', Object.entries(envios).map(([k, v]) => `${k}=${v.filas.length}`).join(', '));