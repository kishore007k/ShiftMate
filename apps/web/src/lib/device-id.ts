const KEY = 'shiftmate-device-id';

/** Stable per-browser id used to scope all data. Client-side only (localStorage). */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
