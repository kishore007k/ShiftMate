'use client';

import { useEffect, useState } from 'react';
import type { DashboardData } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { BarChart } from '@/components/bar-chart';
import { StatCard } from '@/components/stat-card';
import { EarningsBreakdown } from '@/components/earnings-breakdown';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>('/earnings/dashboard')
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Could not reach the server.'),
      );
  }, []);

  if (error) {
    return (
      <Card className="border-l-2 border-destructive">
        <p className="font-medium text-destructive">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      </div>
    );
  }

  const { currentFortnight: cf, fortnightlyEarnings, weeklyHours } = data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted">
          {cf.start} – {cf.end}
        </p>
      </header>

      <Card className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Net this fortnight</p>
          <p className="mt-1 font-display text-4xl font-bold text-primary">
            {formatMoney(cf.netPay)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {cf.totalShifts} shift{cf.totalShifts === 1 ? '' : 's'} · {cf.totalHours}h
          </p>
          <div className="mt-5">
            <EarningsBreakdown summary={cf} />
          </div>
        </div>

        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">
            Net earnings by fortnight
          </p>
          <BarChart
            data={fortnightlyEarnings.map((f) => ({ label: f.label, value: f.net }))}
            format={formatMoney}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total hours" value={`${cf.totalHours}h`} hint="this fortnight" />
        <StatCard label="Shifts" value={String(cf.totalShifts)} hint="this fortnight" />
        <StatCard label="Est. tax" value={formatMoney(cf.estimatedTax)} hint="withheld" />
        <StatCard label="Hourly rate" value={formatMoney(cf.hourlyRate)} hint="per hour" />
      </div>

      <Card>
        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">
          Hours by week
        </p>
        <BarChart
          data={weeklyHours.map((w) => ({ label: w.label, value: w.hours }))}
          format={(n) => `${n}h`}
        />
      </Card>
    </div>
  );
}
