'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ImportResult = {
  imported: number;
  conflicts: number;
  errors: { row: number; reason: string }[];
};

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setError(null);
    setBusy(true);
    try {
      const csv = await file.text();
      const res = await api.post<ImportResult>('/import/shifts', { csv });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-primary">Import</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Import shifts</h1>
        <p className="mt-1 text-muted">
          Upload a CSV of your shifts. Hours and pay are recalculated on import.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
            dragging ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
          )}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="font-display text-lg font-semibold">Drop your CSV here</p>
          <p className="max-w-xs text-sm text-muted">
            Columns: <span className="font-mono text-xs">Date, Start, End, Notes</span> — the same
            format as{' '}
            <Link href="/history" className="text-primary hover:underline">
              Export CSV
            </Link>
            .
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Importing…' : 'Choose file'}
          </Button>
          {fileName && <p className="flex items-center gap-2 text-xs text-muted"><FileText className="h-3.5 w-3.5" />{fileName}</p>}
        </div>

        <Card className="h-fit">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Result</p>
          {!result && !error && (
            <p className="mt-3 text-sm text-muted">Choose a file to see the import summary here.</p>
          )}
          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {result && (
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-display text-2xl font-bold">{result.imported}</span>
                <span className="text-sm text-muted">imported</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Conflicts" value={result.conflicts} muted />
                <Stat label="Errors" value={result.errors.length} muted={result.errors.length === 0} />
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 border-t border-border pt-3">
                  {result.errors.slice(0, 8).map((e) => (
                    <p key={e.row} className="text-xs text-muted">
                      Row {e.row}: {e.reason}
                    </p>
                  ))}
                  {result.errors.length > 8 && (
                    <p className="text-xs text-muted">+{result.errors.length - 8} more…</p>
                  )}
                </div>
              )}
              {result.imported > 0 && (
                <Link href="/shifts" className="text-sm font-medium text-primary hover:underline">
                  View shifts →
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-md bg-surface-elevated p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-1 font-mono text-lg font-semibold', muted ? 'text-muted' : 'text-foreground')}>
        {value}
      </p>
    </div>
  );
}
