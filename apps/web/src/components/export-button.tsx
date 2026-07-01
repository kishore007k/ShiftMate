'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      await downloadFile('/export/shifts', 'shiftmate-shifts.csv');
    } catch {
      // download failed — leave the button ready to retry
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={onExport} disabled={busy}>
      <Download className="h-4 w-4" />
      {busy ? 'Exporting…' : 'Export CSV'}
    </Button>
  );
}
