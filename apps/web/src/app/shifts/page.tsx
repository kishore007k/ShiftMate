'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CalendarPlus, Upload } from 'lucide-react';
import type { Shift } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatMoney, formatDate, formatTime, todayISO } from '@/lib/format';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Shift[]>('/shifts')
      .then(setShifts)
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

  if (!shifts) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-elevated" />
        ))}
      </div>
    );
  }

  const today = todayISO();
  const upcoming = shifts
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const past = shifts.filter((s) => s.date < today); // already DESC from the API

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Shifts</h1>
        <div className="flex items-center gap-3">
          <Link href="/import" className={buttonVariants({ variant: 'secondary' })}>
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link href="/shifts/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Add shift
          </Link>
        </div>
      </header>

      {shifts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <CalendarPlus className="h-8 w-8 text-muted" />
          <p className="text-muted">No shifts logged yet.</p>
          <Link href="/shifts/new" className={buttonVariants({ size: 'sm' })}>
            Add your first shift
          </Link>
        </Card>
      ) : (
        <>
          <ShiftGroup title="Upcoming" shifts={upcoming} />
          <ShiftGroup title="Past" shifts={past} />
        </>
      )}
    </div>
  );
}

function ShiftGroup({ title, shifts }: { title: string; shifts: Shift[] }) {
  if (shifts.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold">{title}</h2>
      <div className="space-y-2">
        {shifts.map((s) => (
          <Link key={s.id} href={`/shifts/${s.id}`}>
            <Card className="flex items-center justify-between transition-transform hover:scale-[0.995]">
              <div>
                <p className="font-medium">{s.notes || 'Shift'}</p>
                <p className="mt-0.5 text-sm text-muted">{formatDate(s.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-primary">
                  {formatMoney(s.grossPay)}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {formatTime(s.startTime)}–{formatTime(s.endTime)} · {s.hoursWorked}h
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
