'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Clock, ArrowRight, CalendarPlus } from 'lucide-react';
import type { Shift, FortnightSummary } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatMoney, formatDate, formatDateLong, formatTime, todayISO } from '@/lib/format';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EarningsBreakdown } from '@/components/earnings-breakdown';

export default function HomePage() {
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [earnings, setEarnings] = useState<FortnightSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<Shift[]>('/shifts'), api.get<FortnightSummary>('/earnings/current')])
      .then(([s, e]) => {
        setShifts(s);
        setEarnings(e);
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

  if (!shifts || !earnings) return <HomeSkeleton />;

  const today = todayISO();
  const upcoming = [...shifts]
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const nextShift = upcoming[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-muted">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming shift${upcoming.length > 1 ? 's' : ''}.`
              : 'No upcoming shifts scheduled.'}
          </p>
        </div>
        <Link href="/shifts/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Add shift
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <NextShiftCard shift={nextShift} />
        <EarningsCard summary={earnings} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Upcoming shifts</h2>
          <Link href="/shifts" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((s) => (
              <UpcomingCard key={s.id} shift={s} />
            ))}
          </div>
        ) : (
          <EmptyUpcoming />
        )}
      </section>
    </div>
  );
}

function NextShiftCard({ shift }: { shift?: Shift }) {
  if (!shift) {
    return (
      <Card className="flex flex-col items-start justify-center gap-3 border-l-2 border-border">
        <CalendarPlus className="h-8 w-8 text-muted" />
        <div>
          <p className="font-display text-lg font-semibold">No next shift</p>
          <p className="text-sm text-muted">Add a shift to see it here.</p>
        </div>
        <Link href="/shifts/new" className={buttonVariants({ size: 'sm' })}>
          Add shift
        </Link>
      </Card>
    );
  }

  return (
    <Card className="border-l-2 border-primary">
      <p className="font-mono text-xs uppercase tracking-wide text-primary">Upcoming next</p>
      <h2 className="mt-2 font-display text-2xl font-bold">{shift.notes || 'Shift'}</h2>

      <div className="mt-5 space-y-2 rounded-md bg-surface-elevated p-4">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-muted" />
          <span>{formatDateLong(shift.date)}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-sm">
          <Clock className="h-4 w-4 text-muted" />
          <span>
            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
          </span>
          <span className="text-muted">· {shift.hoursWorked}h</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-lg font-semibold text-primary">
          {formatMoney(shift.grossPay)}
        </span>
        <Link
          href={`/shifts/${shift.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}

function EarningsCard({ summary }: { summary: FortnightSummary }) {
  return (
    <Card>
      <p className="font-mono text-xs uppercase tracking-wide text-muted">Net this fortnight</p>
      <p className="mt-1 font-display text-4xl font-bold text-primary">
        {formatMoney(summary.netPay)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {summary.totalShifts} shift{summary.totalShifts === 1 ? '' : 's'} · {summary.totalHours}h
      </p>

      <div className="mt-5">
        <EarningsBreakdown summary={summary} />
      </div>
    </Card>
  );
}

function UpcomingCard({ shift }: { shift: Shift }) {
  return (
    <Link href={`/shifts/${shift.id}`}>
      <Card className="h-full transition-transform hover:scale-[0.99]">
        <p className="font-medium">{shift.notes || 'Shift'}</p>
        <p className="mt-1 text-sm text-muted">{formatDate(shift.date)}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
          </span>
          <span className="font-mono text-sm font-semibold text-primary">
            {formatMoney(shift.grossPay)}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function EmptyUpcoming() {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <CalendarPlus className="h-8 w-8 text-muted" />
      <p className="text-muted">No upcoming shifts yet.</p>
      <Link href="/shifts/new" className={buttonVariants({ size: 'sm' })}>
        Add your first shift
      </Link>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-64 animate-pulse rounded-md bg-surface-elevated" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-56 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-56 animate-pulse rounded-lg bg-surface-elevated" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-elevated" />
        ))}
      </div>
    </div>
  );
}
