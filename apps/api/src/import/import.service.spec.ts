import { parseCsv, parseImportCsv, normalizeDate, normalizeTime } from './import.service';

describe('parseCsv', () => {
  it('splits simple rows and columns', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('x,"a, b","he said ""hi"""')).toEqual([['x', 'a, b', 'he said "hi"']]);
  });

  it('tolerates CRLF line endings', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('parseImportCsv', () => {
  const header = 'Date,Start,End,Hours,Gross Pay,Notes';

  it('maps export-format rows to shift DTOs (ignoring Hours/Gross)', () => {
    const { rows, errors } = parseImportCsv(`${header}\n2026-06-01,09:00,17:00,8,168.00,Kitchen`);
    expect(errors).toEqual([]);
    expect(rows).toEqual([{ date: '2026-06-01', startTime: '09:00', endTime: '17:00', notes: 'Kitchen' }]);
  });

  it('trims HH:MM:SS to HH:MM and treats blank notes as undefined', () => {
    const { rows } = parseImportCsv(`${header}\n2026-06-01,09:00:00,17:00:00,8,168,`);
    expect(rows[0].startTime).toBe('09:00');
    expect(rows[0].notes).toBeUndefined();
  });

  it('is column-order independent via header names', () => {
    const { rows } = parseImportCsv('Notes,End,Start,Date\nBar,22:00,16:00,2026-06-02');
    expect(rows[0]).toEqual({ date: '2026-06-02', startTime: '16:00', endTime: '22:00', notes: 'Bar' });
  });

  it('reports bad rows without aborting the good ones', () => {
    const { rows, errors } = parseImportCsv(
      `${header}\nnot-a-date,09:00,17:00,8,168,X\n2026-06-03,09:00,17:00,8,168,Y`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-06-03');
    expect(errors[0].row).toBe(2);
  });

  it('errors when required columns are missing', () => {
    const { rows, errors } = parseImportCsv('Foo,Bar\n1,2');
    expect(rows).toHaveLength(0);
    expect(errors[0].reason).toMatch(/Date, Start and End/);
  });

  it('accepts a Type column as notes (spreadsheet source)', () => {
    const { rows } = parseImportCsv('Date,Start,End,Type\n2026-06-01,16:00,22:00,Kitchen');
    expect(rows[0].notes).toBe('Kitchen');
  });

  it('imports the raw timesheet export (DD/MM/YYYY, am/pm, Total rows)', () => {
    const csv = [
      'Date,Day,Type,Start Time,End Time,Hours,Hourly Pay (AUD),Daily Pay (AUD)',
      '05/01/2026,Monday,FO,2:00 pm,7:00 pm,5.00,21.00,105.00',
      '15/01/2026,Thursday,FO,8:00 am,5:00 pm,9.00,21.00,189.00',
      ',,,,,,,',
      ',,,,Total Hours,37.00,Fortnight Total,1008.00',
    ].join('\r\n');
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toEqual([]); // total/blank rows skipped, not errored
    expect(rows).toEqual([
      { date: '2026-01-05', startTime: '14:00', endTime: '19:00', notes: 'FO' },
      { date: '2026-01-15', startTime: '08:00', endTime: '17:00', notes: 'FO' },
    ]);
  });
});

describe('normalizeDate', () => {
  it('passes ISO through and converts AU day/month/year', () => {
    expect(normalizeDate('2026-01-05')).toBe('2026-01-05');
    expect(normalizeDate('05/01/2026')).toBe('2026-01-05');
    expect(normalizeDate('5-1-2026')).toBe('2026-01-05');
  });
  it('rejects impossible months and junk', () => {
    expect(normalizeDate('01/13/2026')).toBeNull(); // month 13 (DD/MM order)
    expect(normalizeDate('not-a-date')).toBeNull();
  });
});

describe('normalizeTime', () => {
  it('handles 24h and 12h am/pm', () => {
    expect(normalizeTime('16:30')).toBe('16:30');
    expect(normalizeTime('16:30:00')).toBe('16:30');
    expect(normalizeTime('2:00 pm')).toBe('14:00');
    expect(normalizeTime('8:00 am')).toBe('08:00');
    expect(normalizeTime('12:00 pm')).toBe('12:00'); // noon
    expect(normalizeTime('12:00 am')).toBe('00:00'); // midnight
  });
  it('rejects invalid times', () => {
    expect(normalizeTime('25:00')).toBeNull();
    expect(normalizeTime('nope')).toBeNull();
  });
});
