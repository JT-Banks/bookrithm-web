'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Active links are bright; inactive are muted — same hover for both
  const navLink = (href: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `text-sm transition-colors ${
      active
        ? 'text-zinc-50 font-medium underline underline-offset-4 decoration-amber-700'
        : 'library-link'
    }`;
  };

  return (
    <header className="border-b border-amber-950/70 bg-[#100803]/82 backdrop-blur-md px-6 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.32)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">

        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-50">
          <span className="text-2xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]">📚</span>
          <span className="font-serif">Bookrithm</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/books" className={navLink('/books')}>
            Browse
          </Link>

          {user && (
            <>
              <Link href="/shelves" className={navLink('/shelves')}>
                Shelves
              </Link>
              <Link href="/read-log" className={navLink('/read-log')}>
                History
              </Link>
              <Link href="/suggestions" className={navLink('/suggestions')}>
                Suggest
              </Link>
              <Link href="/profile" className={navLink('/profile')}>
                {user.displayName}
              </Link>
              <button onClick={signOut} className="library-link text-sm">
                Sign out
              </button>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}
