'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { MergePrompt } from './merge-prompt';

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
  const { user, loading, logout } = useAuth();

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
          <div className="flex items-center gap-2">
            {!loading &&
              (user ? (
                <button
                  onClick={logout}
                  title="Sign out"
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  <span className="hidden sm:inline">{user.name}</span>
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  Sign in
                </Link>
              ))}
            <button
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-elevated hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <MergePrompt />
        {children}
      </main>
    </div>
  );
}
