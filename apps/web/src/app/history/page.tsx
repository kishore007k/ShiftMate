'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Archive } from 'lucide-react';
import type { Shift, FortnightSummary } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatMoney, formatDate, formatTime, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { EarningsBreakdown } from '@/components/earnings-breakdown';
import { ExportButton } from '@/components/export-button';
import { TimesheetActions } from '@/components/timesheet-actions';

export default function HistoryPage() {
  const [history, setHistory] = useState<FortnightSummary[] | null>(null);
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<FortnightSummary[]>('/earnings/history'),
      api.get<Shift[]>('/shifts'),
    ])
      .then(([h, s]) => {
        setHistory(h);
        setShifts(s);
      })
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

  if (!history || !shifts) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-elevated" />
        ))}
      </div>
    );
  }

  const today = todayISO();
  const past = history.filter((f) => f.end < today); // strictly past fortnights

  const totalNet = past.reduce((sum, f) => sum + f.netPay, 0);
  const totalShifts = past.reduce((sum, f) => sum + f.totalShifts, 0);
  const totalHours = Math.round(past.reduce((sum, f) => sum + f.totalHours, 0) * 100) / 100;
  const rate = past[0]?.hourlyRate;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-primary">Earnings archive</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Shift history</h1>
          <p className="mt-1 text-muted">Review your past fortnights and completed shifts.</p>
        </div>
        <ExportButton />
      </header>

      {past.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Archive className="h-8 w-8 text-muted" />
          <p className="text-muted">No history yet — completed shifts will appear here.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total net" value={formatMoney(totalNet)} hint="all past fortnights" />
            <StatCard label="Total shifts" value={String(totalShifts)} hint="logged" />
            <StatCard label="Hours logged" value={`${totalHours}h`} hint="all past fortnights" />
            <StatCard
              label="Hourly rate"
              value={rate !== undefined ? formatMoney(rate) : '—'}
              hint="per hour"
            />
          </div>

          <div className="space-y-2">
            {past.map((f) => (
              <FortnightCard
                key={f.start}
                fortnight={f}
                shifts={shifts.filter((s) => s.date >= f.start && s.date <= f.end)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FortnightCard({ fortnight, shifts }: { fortnight: FortnightSummary; shifts: Shift[] }) {
  const [open, setOpen] = useState(false);
  const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card className="p-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div>
          <p className="font-medium">
            {formatDate(fortnight.start)} – {formatDate(fortnight.end)}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {fortnight.totalShifts} shift{fortnight.totalShifts === 1 ? '' : 's'} ·{' '}
            {fortnight.totalHours}h
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-success">
            {formatMoney(fortnight.netPay)}
          </span>
          <ChevronDown
            className={cn('h-5 w-5 text-muted transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-5">
          <EarningsBreakdown summary={fortnight} />
          <TimesheetActions start={fortnight.start} end={fortnight.end} />
          {sorted.length > 0 && (
            <div className="space-y-1.5">
              {sorted.map((s) => (
                <Link
                  key={s.id}
                  href={`/shifts/${s.id}`}
                  className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2 text-sm transition-transform hover:scale-[0.995]"
                >
                  <span>
                    <span className="font-medium">{s.notes || 'Shift'}</span>
                    <span className="ml-2 text-muted">{formatDate(s.date)}</span>
                  </span>
                  <span className="flex items-center gap-3 font-mono text-xs text-muted">
                    {formatTime(s.startTime)}–{formatTime(s.endTime)}
                    <span className="text-primary">{formatMoney(s.grossPay)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
