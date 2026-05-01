'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/clients', label: 'Clients' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-sm flex items-center px-6 shrink-0">
      <Link href="/" className="flex items-center gap-2.5 mr-8">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="font-semibold text-foreground hidden sm:inline">Site Health Monitor</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-accent bg-accent-muted'
                  : 'text-text-secondary hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
