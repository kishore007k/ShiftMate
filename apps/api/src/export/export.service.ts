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
