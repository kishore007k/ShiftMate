import { parseCsv, parseImportCsv } from './import.service';

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
});
