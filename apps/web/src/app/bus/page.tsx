'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bus, RefreshCw, MapPin, Footprints, Settings2 } from 'lucide-react';
import type { BusDeparture } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';

type Status = 'loading' | 'ok' | 'not-configured' | 'needs-home' | 'error';

export default function BusPage() {
  const [departures, setDepartures] = useState<BusDeparture[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await api.get<BusDeparture[]>('/transit/departures');
      setDepartures(data);
      setStatus('ok');
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) setStatus('not-configured');
      else if (err instanceof ApiError && err.status === 400) setStatus('needs-home');
      else setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-primary">Transit</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Bus times</h1>
          <p className="mt-1 text-muted">Live bus departures for your next shift.</p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={status === 'loading'}>
          <RefreshCw className={cn('h-4 w-4', status === 'loading' && 'animate-spin')} />
          Refresh
        </Button>
      </header>

      {status === 'loading' && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      )}

      {status === 'not-configured' && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Bus className="h-8 w-8 text-muted" />
          <p className="font-medium">Transit isn&apos;t set up yet</p>
          <p className="max-w-sm text-sm text-muted">
            Live departures need a Google Maps API key on the server
            (<code className="font-mono text-xs">GOOGLE_MAPS_API_KEY</code>). Once it&apos;s
            configured, your bus options will appear here.
          </p>
        </Card>
      )}

      {status === 'needs-home' && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPin className="h-8 w-8 text-muted" />
          <p className="font-medium">Add your home address</p>
          <p className="max-w-sm text-sm text-muted">
            We need a starting point to find your bus route to work.
          </p>
          <Link href="/settings" className={buttonVariants({ size: 'sm' })}>
            <Settings2 className="h-4 w-4" />
            Go to settings
          </Link>
        </Card>
      )}

      {status === 'error' && (
        <Card className="border-l-2 border-destructive">
          <p className="font-medium text-destructive">Couldn&apos;t load departures</p>
          <p className="mt-1 text-sm text-muted">Please try refreshing in a moment.</p>
        </Card>
      )}

      {status === 'ok' &&
        (departures.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Bus className="h-8 w-8 text-muted" />
            <p className="text-muted">No bus departures found for this trip.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {departures.map((d, i) => (
              <DepartureCard key={`${d.routeNumber}-${d.departureTime}-${i}`} departure={d} />
            ))}
          </div>
        ))}
    </div>
  );
}

function DepartureCard({ departure: d }: { departure: BusDeparture }) {
  return (
    <Card className={cn('flex items-center gap-4', d.isRecommended && 'border-l-2 border-primary')}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
        {d.routeNumber}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{d.routeName}</p>
          {d.isRecommended && (
            <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Recommended
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-3 text-sm text-muted">
          <span className="truncate">{d.stopName}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Footprints className="h-3.5 w-3.5" />
            {d.walkingMinutes} min
          </span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-lg font-semibold">
          {new Date(d.departureTime).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </p>
        <p className="mt-0.5 text-xs">
          <StatusBadge status={d.status} delayMinutes={d.delayMinutes} />
          <span className="ml-2 text-muted">{formatRelative(d.departureTime)}</span>
        </p>
      </div>
    </Card>
  );
}

function StatusBadge({ status, delayMinutes }: Pick<BusDeparture, 'status' | 'delayMinutes'>) {
  const map = {
    'on-time': { label: 'On time', className: 'text-success' },
    delayed: { label: delayMinutes ? `+${delayMinutes} min` : 'Delayed', className: 'text-primary' },
    cancelled: { label: 'Cancelled', className: 'text-destructive' },
  } as const;
  const { label, className } = map[status];
  return <span className={cn('font-medium', className)}>{label}</span>;
}
