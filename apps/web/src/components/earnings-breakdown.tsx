import type { FortnightSummary } from '@shiftmate/types';
import { formatMoney } from '@/lib/format';

export function EarningsBreakdown({ summary }: { summary: FortnightSummary }) {
  return (
    <div className="space-y-3">
      <PillRow label="Gross" value={summary.grossPay} accent="bg-primary" />
      <PillRow label="Tax (est.)" value={-summary.estimatedTax} accent="bg-muted" />
      <PillRow label="Net" value={summary.netPay} accent="bg-success" tone="text-success" />
    </div>
  );
}

function PillRow({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: number;
  accent: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted">
        <span className={`h-4 w-1 rounded-full ${accent}`} />
        {label}
      </span>
      <span className={`font-mono text-sm font-medium ${tone ?? ''}`}>{formatMoney(value)}</span>
    </div>
  );
}
