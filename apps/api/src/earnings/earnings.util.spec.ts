import {
  fortnightBounds,
  annualResidentTax,
  estimateFortnightTax,
  summarizeFortnight,
  shortLabel,
} from './earnings.util';
import { Shift, UserSettings } from '@shiftmate/types';

const settings: UserSettings = {
  hourlyRate: 25,
  fortnightStart: '2025-01-06', // a Monday
  taxBracket: 'auto',
  transitPreference: 'google',
  workplaceAddress: 'x',
  homeAddress: 'y',
};

function shift(date: string, hours: number, gross: number): Shift {
  return {
    id: date,
    deviceId: 'd',
    date,
    startTime: '09:00',
    endTime: '17:00',
    hoursWorked: hours,
    grossPay: gross,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };
}

describe('fortnightBounds', () => {
  it('returns the 14-day window containing the anchor itself', () => {
    expect(fortnightBounds('2025-01-06', '2025-01-06')).toEqual({
      start: '2025-01-06',
      end: '2025-01-19',
    });
  });

  it('advances to the next window on day 14', () => {
    expect(fortnightBounds('2025-01-06', '2025-01-20')).toEqual({
      start: '2025-01-20',
      end: '2025-02-02',
    });
  });

  it('handles dates before the anchor', () => {
    expect(fortnightBounds('2025-01-06', '2025-01-05')).toEqual({
      start: '2024-12-23',
      end: '2025-01-05',
    });
  });
});

describe('annualResidentTax', () => {
  it('is zero below the tax-free threshold', () => {
    expect(annualResidentTax(18_200)).toBe(0);
  });

  it('taxes the 16% bracket correctly', () => {
    // (30000 - 18200) * 0.16 = 1888
    expect(annualResidentTax(30_000)).toBeCloseTo(1888, 2);
  });

  it('taxes the 30% bracket with the base amount', () => {
    // 4288 + (60000 - 45000) * 0.30 = 8788
    expect(annualResidentTax(60_000)).toBeCloseTo(8788, 2);
  });
});

describe('estimateFortnightTax', () => {
  it('annualizes for auto', () => {
    // gross 2000/fortnight -> 52000/yr. tax = 4288 + (52000-45000)*0.3 = 6388. /26 = 245.69
    expect(estimateFortnightTax(2000, 'auto')).toBeCloseTo(245.69, 2);
  });

  it('applies a flat marginal rate for a fixed bracket', () => {
    expect(estimateFortnightTax(2000, '19')).toBe(380);
  });
});

describe('summarizeFortnight', () => {
  it('sums only in-range shifts and computes net', () => {
    const shifts = [
      shift('2025-01-07', 8, 200),
      shift('2025-01-10', 5, 125),
      shift('2025-01-25', 8, 200), // outside window
    ];
    const summary = summarizeFortnight(shifts, '2025-01-06', '2025-01-19', settings);
    expect(summary.totalShifts).toBe(2);
    expect(summary.totalHours).toBe(13);
    expect(summary.grossPay).toBe(325);
    expect(summary.netPay).toBe(325 - summary.estimatedTax);
    expect(summary.hourlyRate).toBe(25);
  });

  it('returns zeros for an empty window', () => {
    const summary = summarizeFortnight([], '2025-01-06', '2025-01-19', settings);
    expect(summary.totalShifts).toBe(0);
    expect(summary.grossPay).toBe(0);
    expect(summary.netPay).toBe(0);
  });
});

describe('shortLabel', () => {
  it('formats day and month', () => {
    expect(shortLabel('2025-06-02')).toBe('2 Jun');
  });
});
