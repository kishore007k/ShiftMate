import { cn } from '@/lib/utils';

type Datum = { label: string; value: number };

/** Minimal CSS bar chart. Highlights the last (current) bar. ponytail: no chart lib for simple bars. */
export function BarChart({
  data,
  format,
  emptyLabel = 'No data yet',
}: {
  data: Datum[];
  format?: (n: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);

  if (max === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted">{emptyLabel}</div>
    );
  }

  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d, i) => {
        const isCurrent = i === data.length - 1;
        const height = Math.max((d.value / max) * 150, d.value > 0 ? 4 : 0);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                'w-full rounded-t transition-all',
                isCurrent ? 'bg-primary' : 'bg-surface-elevated',
              )}
              style={{ height }}
              title={format ? format(d.value) : String(d.value)}
            />
            <span className="font-mono text-[10px] text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
