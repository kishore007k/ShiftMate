import { getDeviceId } from './device-id';

// Relative — proxied to the real API by next.config.mjs's rewrite. Keeps every
// request same-origin from the browser's perspective, so the session cookie works
// on Safari/iOS (which blocks cross-site cookies even with credentials: 'include').
const BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send the session cookie cross-origin
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Fetch a plain-text endpoint (with the device header) and return the body as a string. */
export async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'x-device-id': getDeviceId() },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.text();
}

/** Fetch a file (with the device header) and trigger a browser download. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'x-device-id': getDeviceId() },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
