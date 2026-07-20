'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { downloadFile, fetchText } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Props = { start: string; end: string };

/** Copy or download one fortnight's shifts as the tab-separated Excel timesheet block. */
export function TimesheetActions({ start, end }: Props) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'copy' | 'download' | null>(null);
  const [error, setError] = useState(false);

  const path = `/export/fortnight?start=${start}&end=${end}`;

  async function run(action: 'copy' | 'download') {
    setBusy(action);
    setError(false);
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(await fetchText(path));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        await downloadFile(path, `shiftmate-timesheet-${start}.tsv`);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => run('copy')}
        disabled={busy !== null}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy timesheet'}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => run('download')}
        disabled={busy !== null}
      >
        <Download className="h-4 w-4" />
        {busy === 'download' ? 'Downloading…' : 'Download'}
      </Button>
      {error && <span className="text-xs text-destructive">Export failed — try again.</span>}
    </div>
  );
}
