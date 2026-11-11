import { puedeDescargar } from './acceso';

type Celda = string | number | null | undefined;

/**
 * CSV que Excel en español abre directo con doble clic:
 * separador punto y coma, BOM UTF-8 para tildes y ñ, decimales con coma.
 */
export function aCsv(encabezados: string[], filas: Celda[][]) {
  const celda = (v: Celda) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [encabezados, ...filas].map((f) => f.map(celda).join(';'));
  return new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

export function descargar(blob: Blob, nombreArchivo: string) {
  if (!puedeDescargar()) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}