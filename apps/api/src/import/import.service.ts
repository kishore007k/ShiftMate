import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from '@shiftmate/types';
import { ShiftsService } from '../shifts/shifts.service';

export interface ImportResult {
  imported: number;
  conflicts: number;
  errors: { row: number; reason: string }[];
}

@Injectable()
export class ImportService {
  constructor(private readonly shiftsService: ShiftsService) {}

  async importCsv(deviceId: string, text: string): Promise<ImportResult> {
    const { rows, errors } = parseImportCsv(text);

    const existing = await this.shiftsService.findAll(deviceId);
    const seen = new Set(existing.map((s) => key(s.date, s.startTime, s.endTime)));

    let imported = 0;
    let conflicts = 0;
    for (const row of rows) {
      const k = key(row.date, row.startTime, row.endTime);
      if (seen.has(k)) {
        conflicts++;
        continue;
      }
      await this.shiftsService.create(deviceId, row);
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
    const date = (cells[col.date] ?? '').trim();
    const startTime = (cells[col.start] ?? '').trim().slice(0, 5);
    const endTime = (cells[col.end] ?? '').trim().slice(0, 5);
    const notes = col.notes >= 0 ? (cells[col.notes] ?? '').trim() : '';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ row: i + 1, reason: `Invalid date "${date}"` });
      continue;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      errors.push({ row: i + 1, reason: 'Start/End must be HH:MM' });
      continue;
    }
    rows.push({ date, startTime, endTime, notes: notes || undefined });
  }
  return { rows, errors };
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
