import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-muted">Sync your shifts across every device.</p>
      </header>
      <Card className="space-y-3">
        <a
          href={`${API_BASE}/api/auth/google`}
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}
        >
          Continue with Google
        </a>
        <a
          href={`${API_BASE}/api/auth/github`}
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}
        >
          Continue with GitHub
        </a>
      </Card>
      <p className="text-center text-xs text-muted">
        Not signed in? Your shifts still stay on this device.
      </p>
    </div>
  );
}
