const MONEY = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

export function formatMoney(n: number): string {
  return MONEY.format(n);
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Mon, 24 Oct" */
export function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** "Monday, 24 Oct" */
export function formatDateLong(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

/** "9:00 AM" from "09:00" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "in 8 min" / "in 2h 15m" / "Fri, 3 Jul" depending on how far off `iso` is. */
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const min = Math.round((d.getTime() - Date.now()) / 60_000);
  if (min < 0) return 'departed';
  if (min < 60) return `in ${min} min`;
  if (min < 12 * 60) return `in ${Math.floor(min / 60)}h ${min % 60}m`;
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** ponytail: client preview mirror of the server's hours calc (server is source of truth). */
export function computeHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let endMins = eh * 60 + em;
  const startMins = sh * 60 + sm;
  if (endMins <= startMins) endMins += 24 * 60; // overnight
  return Math.round(((endMins - startMins) / 60) * 100) / 100;
}
