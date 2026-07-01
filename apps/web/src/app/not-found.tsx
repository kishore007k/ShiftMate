import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <p className="font-mono text-sm uppercase tracking-wide text-primary">404</p>
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="text-muted">That page doesn&apos;t exist or may have moved.</p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </div>
  );
}
