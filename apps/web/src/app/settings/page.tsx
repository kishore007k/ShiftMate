'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { UserSettings } from '@shiftmate/types';
import { api, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<UserSettings>('/settings')
      .then(setSettings)
      .catch((err: unknown) =>
        setLoadError(err instanceof ApiError ? err.message : 'Could not reach the server.'),
      );
  }, []);

  function set<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setSave('idle');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    if (!(settings.hourlyRate > 0)) {
      setSave('error');
      setErrorMsg('Hourly rate must be greater than 0.');
      return;
    }
    setSave('saving');
    setErrorMsg(null);
    try {
      const updated = await api.patch<UserSettings>('/settings', settings);
      setSettings(updated);
      setSave('saved');
    } catch (err) {
      setSave('error');
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not save settings.');
    }
  }

  if (loadError) {
    return (
      <Card className="border-l-2 border-destructive">
        <p className="font-medium text-destructive">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">{loadError}</p>
      </Card>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-surface-elevated" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">These apply to shifts on this device.</p>
      </header>

      <Section title="Pay & schedule">
        <Field label="Hourly rate (AUD)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={settings.hourlyRate}
            onChange={(e) => set('hourlyRate', Number(e.target.value))}
            className="font-mono"
          />
        </Field>
        <Field label="Fortnight start" hint="The date your pay cycle begins.">
          <Input
            type="date"
            value={settings.fortnightStart}
            onChange={(e) => set('fortnightStart', e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Tax">
        <Field label="Tax estimation" hint="Used to estimate net pay on the dashboard.">
          <Select
            value={settings.taxBracket}
            onChange={(e) => set('taxBracket', e.target.value as UserSettings['taxBracket'])}
          >
            <option value="auto">Automatic (progressive)</option>
            <option value="0">0% — tax-free</option>
            <option value="19">19%</option>
            <option value="32.5">32.5%</option>
            <option value="37">37%</option>
            <option value="45">45%</option>
          </Select>
        </Field>
      </Section>

      <Section title="Commute">
        <Field label="Home address" hint="Starting point for bus times.">
          <Input
            value={settings.homeAddress}
            placeholder="e.g. 10 Example St, Epping VIC"
            onChange={(e) => set('homeAddress', e.target.value)}
          />
        </Field>
        <Field label="Workplace address">
          <Input
            value={settings.workplaceAddress}
            onChange={(e) => set('workplaceAddress', e.target.value)}
          />
        </Field>
        <Field label="Transit provider">
          <Select
            value={settings.transitPreference}
            onChange={(e) =>
              set('transitPreference', e.target.value as UserSettings['transitPreference'])
            }
          >
            <option value="google">Google Maps</option>
            <option value="ptv">PTV</option>
          </Select>
        </Field>
      </Section>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={save === 'saving'}>
          {save === 'saving' ? 'Saving…' : 'Save settings'}
        </Button>
        {save === 'saved' && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {save === 'error' && errorMsg && <span className="text-sm text-destructive">{errorMsg}</span>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}
