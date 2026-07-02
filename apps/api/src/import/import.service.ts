import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from '@shiftmate/types';
import { ShiftsService } from '../shifts/shifts.service';
import { AuthContext } from '../auth/auth-context';

export interface ImportResult {
  imported: number;
  conflicts: number;
  errors: { row: number; reason: string }[];
}

@Injectable()
export class ImportService {
  constructor(private readonly shiftsService: ShiftsService) {}

  async importCsv(authCtx: AuthContext, text: string): Promise<ImportResult> {
    const { rows, errors } = parseImportCsv(text);

    const existing = await this.shiftsService.findAll(authCtx);
    const seen = new Set(existing.map((s) => key(s.date, s.startTime, s.endTime)));

    let imported = 0;
    let conflicts = 0;
    for (const row of rows) {
      const k = key(row.date, row.startTime, row.endTime);
      if (seen.has(k)) {
        conflicts++;
        continue;
      }
      await this.shiftsService.create(authCtx, row);
      seen.add(k);
      imported++;
    }

    return { imported, conflicts, errors };
  }
}

function key(date: string, start: string, end: string): string {
  return `${date}|${start.slice(0, 5)}|${end.slice(0, 5)}`;
}

/**
 * Parse a CSV (export-compatible: Date, Start, End, Hours, Gross Pay, Notes) into shift DTOs.
 * Header-mapped so column order is flexible; Hours/Gross Pay are ignored (recomputed on create).
 */
export function parseImportCsv(text: string): {
  rows: CreateShiftDto[];
  errors: { row: number; reason: string }[];
} {
  const table = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (table.length === 0) return { rows: [], errors: [] };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = {
    date: header.findIndex((h) => h === 'date'),
    start: header.findIndex((h) => h.startsWith('start')),
    end: header.findIndex((h) => h.startsWith('end')),
    notes: header.findIndex((h) => h === 'notes' || h === 'role' || h === 'type'),
  };
  if (col.date < 0 || col.start < 0 || col.end < 0) {
    return { rows: [], errors: [{ row: 1, reason: 'Header must include Date, Start and End columns.' }] };
  }

  const rows: CreateShiftDto[] = [];
  const errors: { row: number; reason: string }[] = [];
  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const dateRaw = (cells[col.date] ?? '').trim();
    if (!dateRaw) continue; // separator / "Total Hours" rows have no date — skip silently

    const date = normalizeDate(dateRaw);
    if (!date) {
      errors.push({ row: i + 1, reason: `Invalid date "${dateRaw}"` });
      continue;
    }
    const startTime = normalizeTime((cells[col.start] ?? '').trim());
    const endTime = normalizeTime((cells[col.end] ?? '').trim());
    if (!startTime || !endTime) {
      errors.push({ row: i + 1, reason: 'Start/End must be a time (e.g. 16:30 or 4:30 pm)' });
      continue;
    }
    const notes = col.notes >= 0 ? (cells[col.notes] ?? '').trim() : '';
    rows.push({ date, startTime, endTime, notes: notes || undefined });
  }
  return { rows, errors };
}

/** Accept YYYY-MM-DD or AU-style DD/MM/YYYY (or DD-MM-YYYY) → returns YYYY-MM-DD, else null. */
export function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/); // day/month/year (Australian)
  if (m) {
    const [, d, mo, y] = m;
    if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31) {
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return null;
}

/** Accept 24h "HH:MM[:SS]" or 12h "h[:mm] am/pm" → returns "HH:MM" (24h), else null. */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim().toLowerCase();

  const h24 = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24) {
    const h = +h24[1];
    return h <= 23 && +h24[2] <= 59 ? `${String(h).padStart(2, '0')}:${h24[2]}` : null;
  }

  const h12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (h12) {
    let h = +h12[1];
    const min = h12[2] ?? '00';
    if (h < 1 || h > 12 || +min > 59) return null;
    if (h12[3] === 'am') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return `${String(h).padStart(2, '0')}:${min}`;
  }

  return null;
}

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, and CRLF/LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
