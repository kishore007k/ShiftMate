'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Shift, CreateShiftDto, UserSettings } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { computeHours, formatMoney } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Props = { shiftId?: string; initial?: CreateShiftDto };

export function ShiftForm({ shiftId, initial }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? '');
  const [startTime, setStartTime] = useState(initial?.startTime ?? '');
  const [endTime, setEndTime] = useState(initial?.endTime ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [rate, setRate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<UserSettings>('/settings')
      .then((s) => setRate(s.hourlyRate))
      .catch(() => {});
  }, []);

  const hours = startTime && endTime ? computeHours(startTime, endTime) : 0;
  const gross = rate !== null ? Math.round(hours * rate * 100) / 100 : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const body: CreateShiftDto = { date, startTime, endTime, notes: notes || undefined };
    try {
      if (shiftId) {
        await api.patch<Shift>(`/shifts/${shiftId}`, body);
        router.push(`/shifts/${shiftId}`);
      } else {
        const created = await api.post<Shift>('/shifts', body);
        router.push(`/shifts/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the shift.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="space-y-5 border-l-2 border-primary">
        <h2 className="font-display text-lg font-semibold">Shift details</h2>

        <Field label="Date">
          <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start time">
            <Input
              type="time"
              required
              className="font-mono"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="End time">
            <Input
              type="time"
              required
              className="font-mono"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Role / notes">
          <Input
            placeholder="e.g. Kitchen"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : shiftId ? 'Save changes' : 'Create shift'}
          </Button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </Card>

      <Card className="h-fit">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Projection</p>
        <p className="mt-2 font-display text-3xl font-bold text-primary">
          {gross !== null ? formatMoney(gross) : '—'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {hours > 0 ? `${hours}h` : 'Set times'}
          {rate !== null && hours > 0 ? ` × ${formatMoney(rate)}/hr` : ''}
        </p>
        <p className="mt-4 text-xs text-muted">
          Estimated gross. Tax and net are calculated after saving.
        </p>
      </Card>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
