import { Injectable } from '@nestjs/common';
import { Shift, UserSettings, FortnightSummary, DashboardData } from '@shiftmate/types';
import { ShiftsService } from '../shifts/shifts.service';
import { SettingsService } from '../settings/settings.service';
import { AuthContext } from '../auth/auth-context';
import {
  fortnightBounds,
  periodBounds,
  summarizeFortnight,
  toISODate,
  parseUTC,
  shortLabel,
} from './earnings.util';

const DAY_MS = 86_400_000;

@Injectable()
export class EarningsService {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly settingsService: SettingsService,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async currentFortnight(authCtx: AuthContext): Promise<FortnightSummary> {
    const settings = await this.settingsService.get(authCtx);
    const shifts = await this.shiftsService.findAll(authCtx);
    const { start, end } = fortnightBounds(settings.fortnightStart, this.today());
    return summarizeFortnight(shifts, start, end, settings);
  }

  /** Past fortnights (most recent first) that contain at least one shift. */
  async history(authCtx: AuthContext): Promise<FortnightSummary[]> {
    const settings = await this.settingsService.get(authCtx);
    const shifts = await this.shiftsService.findAll(authCtx);
    if (shifts.length === 0) return [];

    // Walk fortnight periods from the current one back to the earliest shift.
    const earliest = shifts[shifts.length - 1].date;
    const summaries: FortnightSummary[] = [];
    let cursor = this.today();
    while (cursor >= earliest) {
      const { start, end } = fortnightBounds(settings.fortnightStart, cursor);
      const summary = summarizeFortnight(shifts, start, end, settings);
      if (summary.totalShifts > 0) summaries.push(summary);
      cursor = toISODate(parseUTC(start) - DAY_MS); // day before this fortnight
    }
    return summaries;
  }

  async dashboard(authCtx: AuthContext): Promise<DashboardData> {
    const settings = await this.settingsService.get(authCtx);
    const shifts = await this.shiftsService.findAll(authCtx);
    const today = this.today();

    const fortnightlyEarnings = this.recentPeriods(shifts, settings, today, 14, 6)
      .reverse()
      .map((s) => ({ label: shortLabel(s.start), gross: s.grossPay, net: s.netPay }));

    const weeklyHours = this.recentPeriods(shifts, settings, today, 7, 8)
      .reverse()
      .map((s) => ({ label: shortLabel(s.start), hours: s.totalHours }));

    const { start, end } = fortnightBounds(settings.fortnightStart, today);
    return {
      fortnightlyEarnings,
      weeklyHours,
      currentFortnight: summarizeFortnight(shifts, start, end, settings),
    };
  }

  /** The `count` most recent periods of `lengthDays`, newest first. */
  private recentPeriods(
    shifts: Shift[],
    settings: UserSettings,
    today: string,
    lengthDays: number,
    count: number,
  ): FortnightSummary[] {
    const out: FortnightSummary[] = [];
    let cursor = today;
    for (let i = 0; i < count; i++) {
      const { start, end } = periodBounds(settings.fortnightStart, cursor, lengthDays);
      out.push(summarizeFortnight(shifts, start, end, settings));
      cursor = toISODate(parseUTC(start) - DAY_MS);
    }
    return out;
  }
}
