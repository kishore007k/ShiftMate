import { ShiftForm } from '@/components/shift-form';

export default function NewShiftPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Add new shift</h1>
        <p className="mt-1 text-muted">Log a shift to track your hours and earnings.</p>
      </header>
      <ShiftForm />
    </div>
  );
}
