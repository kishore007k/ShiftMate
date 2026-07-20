import { Injectable } from '@nestjs/common';
import { Shift } from '@shiftmate/types';
import { ShiftsService } from '../shifts/shifts.service';
import { AuthContext } from '../auth/auth-context';

@Injectable()
export class ExportService {
  constructor(private readonly shiftsService: ShiftsService) {}

  async shiftsCsv(authCtx: AuthContext): Promise<string> {
    const shifts = await this.shiftsService.findAll(authCtx);
    return shiftsToCsv(shifts);
  }

  /** Timesheet rows for the shifts within [start, end] inclusive.
   * 'tsv' is the paste-into-Excel block; 'csv' adds an Hours formula column + total row. */
  async fortnightTimesheet(
    authCtx: AuthContext,
    start: string,
    end: string,
    format: 'tsv' | 'csv' = 'tsv',
  ): Promise<string> {
    const shifts = await this.shiftsService.findAll(authCtx);
    const inRange = shifts.filter((s) => s.date >= start && s.date <= end);
    return format === 'csv' ? shiftsToTimesheetCsv(inRange) : shiftsToTimesheet(inRange);
  }
}

const HEADER = ['Date', 'Start', 'End', 'Hours', 'Gross Pay', 'Notes'];

/** Build an RFC-4180 CSV (chronological) from shifts, escaping quotes/commas/newlines. */
export function shiftsToCsv(shifts: Shift[]): string {
  const sorted = [...shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
  const rows = sorted.map((s) => [
    s.date,
    s.startTime.slice(0, 5), // trim Postgres "HH:MM:SS" to "HH:MM"
    s.endTime.slice(0, 5),
    String(s.hoursWorked),
    s.grossPay.toFixed(2),
    s.notes ?? '',
  ]);
  return [HEADER, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Build the paste-into-Excel timesheet block (chronological, no header):
 * one tab-separated row per shift — DD/MM/YYYY, weekday name, 12-hour start and end.
 * e.g. "22/06/2026\tMonday\t5:00 pm\t10:00 pm"
 */
export function shiftsToTimesheet(shifts: Shift[]): string {
  const sorted = [...shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
  return sorted
    .map((s) =>
      [auDate(s.date), weekdayName(s.date), time12(s.startTime), time12(s.endTime)].join('\t'),
    )
    .join('\r\n');
}

/** "2026-06-22" → "22/06/2026" (Australian day-first). */
export function auDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** "2026-06-22" → "Monday". UTC so the weekday never shifts with server timezone. */
export function weekdayName(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "17:00" or Postgres "17:00:00" → "5:00 pm". */
export function time12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/**
 * Timesheet as a CSV Excel evaluates on open (chronological, no header):
 * the four timesheet columns plus an Hours formula per row and a Total Hours row.
 * Row n: `22/06/2026,Monday,5:00 pm,10:00 pm,"=MOD(Dn-Cn,1)*24"` — Excel parses the
 * 12-hour cells as times, so MOD(end-start,1) survives overnight shifts. Re-importing
 * this file is safe: the import parser skips the date-less total row and recomputes hours.
 */
export function shiftsToTimesheetCsv(shifts: Shift[]): string {
  const sorted = [...shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
  if (sorted.length === 0) return '';

  const rows = sorted.map((s, i) => [
    auDate(s.date),
    weekdayName(s.date),
    time12(s.startTime),
    time12(s.endTime),
    `=MOD(D${i + 1}-C${i + 1},1)*24`, // rows are 1-based and there is no header row
  ]);
  rows.push(['', '', '', 'Total Hours', `=SUM(E1:E${sorted.length})`]);
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}
