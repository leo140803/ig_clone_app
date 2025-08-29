const BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;

type Options = {
  method?: 'GET'|'POST'|'PATCH'|'DELETE';
  token?: string | null;
  body?: any;
  headers?: Record<string,string>;
};

function isFormDataLike(v: any) {
  // RN/Expo FormData check
  return typeof FormData !== 'undefined' && v instanceof FormData;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', token, body, headers = {} } = opts;

  const isForm = isFormDataLike(body);
  const isString = typeof body === 'string';
  const isObject = body != null && typeof body === 'object' && !isForm;

  const finalHeaders: Record<string,string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Set Content-Type hanya untuk JSON (bukan FormData)
    ...(!isForm ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  // Hapus Content-Type kalau user override ke multipart
  if (isForm && finalHeaders['Content-Type']) delete finalHeaders['Content-Type'];

  const finalBody =
    body == null
      ? undefined
      : isForm
      ? body // biarkan fetch set boundary
      : isString
      ? body // sudah string JSON
      : isObject
      ? JSON.stringify(body) // object → stringify
      : undefined;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: finalBody,
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

// Multipart tetap OK
export async function apiMultipart<T>(path: string, form: FormData, opts: { method?: 'POST'|'PATCH'; token?: string|null } = {}) {
  const { method = 'PATCH', token } = opts;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
      // ❌ jangan set Content-Type
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
