import { shiftsToCsv, shiftsToTimesheet, auDate, weekdayName, time12 } from './export.service';
import { Shift } from '@shiftmate/types';

function shift(over: Partial<Shift>): Shift {
  return {
    id: 'id',
    deviceId: 'd',
    date: '2026-06-01',
    startTime: '09:00',
    endTime: '17:00',
    hoursWorked: 8,
    grossPay: 168,
    notes: undefined,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...over,
  };
}

describe('shiftsToCsv', () => {
  it('writes a header row', () => {
    expect(shiftsToCsv([]).split('\r\n')[0]).toBe('Date,Start,End,Hours,Gross Pay,Notes');
  });

  it('formats gross pay to 2 decimals and includes fields', () => {
    const csv = shiftsToCsv([shift({ grossPay: 168, notes: 'Kitchen' })]);
    expect(csv.split('\r\n')[1]).toBe('2026-06-01,09:00,17:00,8,168.00,Kitchen');
  });

  it('sorts chronologically regardless of input order', () => {
    const csv = shiftsToCsv([shift({ date: '2026-06-03' }), shift({ date: '2026-06-01' })]);
    const rows = csv.split('\r\n');
    expect(rows[1].startsWith('2026-06-01')).toBe(true);
    expect(rows[2].startsWith('2026-06-03')).toBe(true);
  });

  it('escapes notes containing commas and quotes', () => {
    const csv = shiftsToCsv([shift({ notes: 'Bar, then "close"' })]);
    expect(csv.split('\r\n')[1]).toContain('"Bar, then ""close"""');
  });

  it('renders empty notes as an empty field', () => {
    const csv = shiftsToCsv([shift({ notes: undefined })]);
    expect(csv.split('\r\n')[1].endsWith(',')).toBe(true);
  });
});

describe('shiftsToTimesheet', () => {
  it('renders a headerless tab-separated row per shift', () => {
    const tsv = shiftsToTimesheet([
      shift({ date: '2026-06-22', startTime: '17:00', endTime: '22:00' }),
    ]);
    expect(tsv).toBe('22/06/2026\tMonday\t5:00 pm\t10:00 pm');
  });

  it('sorts chronologically and joins rows with CRLF', () => {
    const tsv = shiftsToTimesheet([
      shift({ date: '2026-06-25', startTime: '16:30', endTime: '22:00' }),
      shift({ date: '2026-06-22', startTime: '17:00', endTime: '22:00' }),
    ]);
    expect(tsv.split('\r\n')).toEqual([
      '22/06/2026\tMonday\t5:00 pm\t10:00 pm',
      '25/06/2026\tThursday\t4:30 pm\t10:00 pm',
    ]);
  });

  it('accepts Postgres HH:MM:SS times', () => {
    const tsv = shiftsToTimesheet([
      shift({ date: '2026-07-05', startTime: '12:00:00', endTime: '18:00:00' }),
    ]);
    expect(tsv).toBe('05/07/2026\tSunday\t12:00 pm\t6:00 pm');
  });

  it('returns an empty string for no shifts', () => {
    expect(shiftsToTimesheet([])).toBe('');
  });
});

describe('timesheet formatting helpers', () => {
  it('auDate converts ISO to day-first', () => {
    expect(auDate('2026-07-04')).toBe('04/07/2026');
  });

  it('weekdayName is timezone-independent', () => {
    expect(weekdayName('2026-07-04')).toBe('Saturday');
    expect(weekdayName('2026-07-05')).toBe('Sunday');
  });

  it('time12 handles midnight, noon and morning times', () => {
    expect(time12('00:15')).toBe('12:15 am');
    expect(time12('12:00')).toBe('12:00 pm');
    expect(time12('09:05')).toBe('9:05 am');
    expect(time12('23:59')).toBe('11:59 pm');
  });
});
