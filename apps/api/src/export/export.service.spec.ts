import { shiftsToCsv } from './export.service';
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
