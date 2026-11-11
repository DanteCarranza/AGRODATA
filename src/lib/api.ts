const BASE = import.meta.env.VITE_API_URL ?? '/api';
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | null | undefined>;

export async function apiGet<T>(path: string, query: Query = {}): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v !== null && v !== undefined && qs.set(k, String(v)));
  const res = await fetch(`${BASE}${path}${qs.size ? `?${qs}` : ''}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new ApiError(res.status, `No se pudo cargar ${path} (${res.status})`);
  return res.json() as Promise<T>;
}





export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `No se pudo enviar ${path} (${res.status})`);
  return res.json() as Promise<T>;
}