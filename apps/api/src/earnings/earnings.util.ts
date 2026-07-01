import { Shift, FortnightSummary, UserSettings } from '@shiftmate/types';

const DAY_MS = 86_400_000;

export function parseUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The [start, end] date range of the length-day period (relative to anchor) containing ref. */
export function periodBounds(
  anchorStr: string,
  refStr: string,
  lengthDays: number,
): { start: string; end: string } {
  const anchor = parseUTC(anchorStr);
  const ref = parseUTC(refStr);
  const period = Math.floor((ref - anchor) / DAY_MS / lengthDays);
  const start = anchor + period * lengthDays * DAY_MS;
  const end = start + (lengthDays - 1) * DAY_MS;
  return { start: toISODate(start), end: toISODate(end) };
}

export function fortnightBounds(anchorStr: string, refStr: string) {
  return periodBounds(anchorStr, refStr, 14);
}

/** ATO resident annual tax. ponytail: 2024-25 (Stage 3) brackets — update yearly if rates change. */
export function annualResidentTax(income: number): number {
  if (income <= 18_200) return 0;
  if (income <= 45_000) return (income - 18_200) * 0.16;
  if (income <= 135_000) return 4_288 + (income - 45_000) * 0.3;
  if (income <= 190_000) return 31_288 + (income - 135_000) * 0.37;
  return 51_638 + (income - 190_000) * 0.45;
}

/** Estimated tax on one fortnight's gross. 'auto' annualizes; a fixed bracket is a flat marginal rate. */
export function estimateFortnightTax(gross: number, taxBracket: UserSettings['taxBracket']): number {
  if (taxBracket === 'auto') {
    return round2(annualResidentTax(gross * 26) / 26);
  }
  return round2(gross * (Number(taxBracket) / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Summarize the shifts falling within [start, end] inclusive. */
export function summarizeFortnight(
  shifts: Shift[],
  start: string,
  end: string,
  settings: UserSettings,
): FortnightSummary {
  const inRange = shifts.filter((s) => s.date >= start && s.date <= end);
  const totalHours = round2(inRange.reduce((sum, s) => sum + s.hoursWorked, 0));
  const grossPay = round2(inRange.reduce((sum, s) => sum + s.grossPay, 0));
  const estimatedTax = estimateFortnightTax(grossPay, settings.taxBracket);
  return {
    start,
    end,
    totalShifts: inRange.length,
    totalHours,
    grossPay,
    estimatedTax,
    netPay: round2(grossPay - estimatedTax),
    hourlyRate: settings.hourlyRate,
  };
}

/** Short label like "2 Jun" for a period start date. */
export function shortLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]}`;
}
