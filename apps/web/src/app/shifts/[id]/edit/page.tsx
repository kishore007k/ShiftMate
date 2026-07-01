'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Shift, CreateShiftDto } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { ShiftForm } from '@/components/shift-form';
import { Card } from '@/components/ui/card';

export default function EditShiftPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<CreateShiftDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Shift>(`/shifts/${id}`)
      .then((s) =>
        setInitial({
          date: s.date,
          startTime: s.startTime.slice(0, 5), // trim Postgres "HH:MM:SS" for <input type=time>
          endTime: s.endTime.slice(0, 5),
          notes: s.notes,
        }),
      )
      .catch((err: unknown) =>
        setError(err instanceof ApiError && err.status === 404 ? 'notfound' : 'error'),
      );
  }, [id]);

  if (error) {
    return (
      <Card className="border-l-2 border-destructive">
        <p className="font-medium">{error === 'notfound' ? 'Shift not found' : 'Something went wrong'}</p>
        <Link href="/shifts" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Back to shifts
        </Link>
      </Card>
    );
  }

  if (!initial) return <div className="h-64 animate-pulse rounded-lg bg-surface-elevated" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Edit shift</h1>
        <p className="mt-1 text-muted">Update the details of this shift.</p>
      </header>
      <ShiftForm shiftId={id} initial={initial} />
    </div>
  );
}
