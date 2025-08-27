// lib/api.ts
const BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;

type Options = {
  method?: 'GET'|'POST'|'PATCH'|'DELETE';
  token?: string | null;
  body?: any;
  headers?: Record<string,string>;
};

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', token, body, headers = {} } = opts;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const message =
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : undefined) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

// ---- Tambahan: multipart untuk upload avatar
export async function apiMultipart<T>(path: string, form: FormData, opts: { method?: 'POST'|'PATCH'; token?: string|null } = {}) {
  const { method = 'PATCH', token } = opts;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      // JANGAN set 'Content-Type', biar boundary otomatis
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
    body: form,
  });
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const message =
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : undefined) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
