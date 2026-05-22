'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

function NavIcon({ name }: { name: 'browse' | 'shelves' | 'history' | 'suggest' | 'profile' | 'signout' }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'browse') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle {...common} cx="11" cy="11" r="6" />
        <path {...common} d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === 'shelves') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M5 5h14M5 12h14M5 19h14" />
        <path {...common} d="M8 5v14M16 5v14" />
      </svg>
    );
  }

  if (name === 'history') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 12a8 8 0 1 0 3-6.2" />
        <path {...common} d="M4 4v5h5M12 8v5l4 2" />
      </svg>
    );
  }

  if (name === 'suggest') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M15 4c4 1 6 5 5 9-1 5-7 8-14 10 2-7 5-14 9-19Z" />
        <path {...common} d="M6 22c4-5 8-9 13-13" />
      </svg>
    );
  }

  if (name === 'signout') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M14 7V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-2" />
        <path {...common} d="M10 12h10M17 9l3 3-3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle {...common} cx="12" cy="8" r="4" />
      <path {...common} d="M5 21c1.5-5 4.5-8 7-8s5.5 3 7 8" />
    </svg>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const navLink = (href: string, label: string, icon: Parameters<typeof NavIcon>[0]['name']) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 text-sm transition-colors ${
          active
            ? 'text-zinc-50 underline underline-offset-4 decoration-amber-700'
            : 'text-zinc-300 hover:text-zinc-50'
        }`}
      >
        <span className="h-4 w-4 text-amber-300/90"><NavIcon name={icon} /></span>
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-amber-900/70 bg-[#100803]/88 px-6 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 text-zinc-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-amber-800/55 bg-black/25 text-amber-300">
            <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
              <path d="M4 5h7a4 4 0 0 1 4 4v10H8a4 4 0 0 0-4 4V5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 9a4 4 0 0 1 4-4h1v16h-1a4 4 0 0 0-4 2V9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight">Bookrithm</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
          {navLink('/books', 'Browse', 'browse')}

          {user && (
            <>
              {navLink('/shelves', 'Shelves', 'shelves')}
              {navLink('/read-log', 'History', 'history')}
              {navLink('/suggestions', 'Suggest', 'suggest')}
              <span className="hidden h-6 w-px bg-amber-900/70 sm:block" />
              {navLink('/profile', user.displayName, 'profile')}
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-zinc-50"
              >
                <span className="h-4 w-4 text-amber-300/90"><NavIcon name="signout" /></span>
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
