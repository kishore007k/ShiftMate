'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import type { Shift } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatMoney, formatDateLong, formatTime } from '@/lib/format';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [shift, setShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<Shift>(`/shifts/${id}`)
      .then(setShift)
      .catch((err: unknown) =>
        setError(err instanceof ApiError && err.status === 404 ? 'notfound' : 'error'),
      );
  }, [id]);

  async function onDelete() {
    if (!window.confirm('Delete this shift? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/shifts/${id}`);
      router.push('/shifts');
      router.refresh();
    } catch {
      setDeleting(false);
      setError('error');
    }
  }

  if (error === 'notfound') {
    return (
      <Card className="border-l-2 border-destructive">
        <p className="font-medium">Shift not found</p>
        <Link href="/shifts" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Back to shifts
        </Link>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-2 border-destructive">
        <p className="font-medium text-destructive">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">Could not load this shift.</p>
      </Card>
    );
  }

  if (!shift) return <div className="h-64 animate-pulse rounded-lg bg-surface-elevated" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/shifts"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Shifts
      </Link>

      <Card className="border-l-2 border-primary">
        <p className="font-mono text-xs uppercase tracking-wide text-primary">Shift</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{shift.notes || 'Shift'}</h1>

        <div className="mt-5 space-y-2 rounded-md bg-surface-elevated p-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted" />
            {formatDateLong(shift.date)}
          </div>
          <div className="flex items-center gap-3 font-mono text-sm">
            <Clock className="h-4 w-4 text-muted" />
            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            <span className="text-muted">· {shift.hoursWorked}h</span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm text-muted">Gross pay</span>
          <span className="font-mono text-2xl font-bold text-primary">
            {formatMoney(shift.grossPay)}
          </span>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Link href={`/shifts/${id}/edit`} className={buttonVariants({ variant: 'secondary' })}>
          <Pencil className="h-4 w-4" /> Edit
        </Link>
        <button
          onClick={onDelete}
          disabled={deleting}
          className={buttonVariants({ variant: 'destructive' })}
        >
          <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
