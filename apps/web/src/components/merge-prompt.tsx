'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { api } from '@/lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';

const PROMPTED_KEY = 'shiftmate-merge-prompted';

/** One-shot, per-device prompt: link this device's pre-login shift history to the
 * signed-in account. Shown at most once — never re-nags once answered either way. */
export function MergePrompt() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState<number | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (localStorage.getItem(PROMPTED_KEY)) return;
    setVisible(true);
  }, [loading, user]);

  async function respond(merge: boolean) {
    localStorage.setItem(PROMPTED_KEY, '1');
    if (!merge) {
      setVisible(false);
      return;
    }
    setBusy(true);
    try {
      const result = await api.post<{ claimed: number }>('/auth/merge', undefined);
      setClaimed(result.claimed);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  if (claimed !== null) {
    return (
      <Card className="mb-6 flex items-center justify-between gap-4 border-l-2 border-success">
        <p className="text-sm">
          {claimed > 0
            ? `Linked ${claimed} shift${claimed === 1 ? '' : 's'} from this device to your account.`
            : 'No unlinked shifts found on this device.'}
        </p>
        <button
          className="shrink-0 text-sm text-muted underline"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      </Card>
    );
  }

  return (
    <Card className="mb-6 flex items-center justify-between gap-4">
      <p className="text-sm">
        This device has shift history from before you signed in. Link it to your account?
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="secondary" onClick={() => respond(false)} disabled={busy}>
          Not now
        </Button>
        <Button size="sm" onClick={() => respond(true)} disabled={busy}>
          {busy ? 'Linking…' : 'Link shifts'}
        </Button>
      </div>
    </Card>
  );
}
