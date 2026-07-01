'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shifts', label: 'Shifts' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/bus', label: 'Bus' },
  { href: '/settings', label: 'Settings' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <img src="/logo.png" alt="" className="h-7 w-7" />
              ShiftMate
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isActive(pathname, item.href)
                      ? 'bg-surface-elevated text-foreground'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-elevated hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive(pathname, item.href)
                ? 'bg-surface-elevated text-foreground'
                : 'text-muted',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
