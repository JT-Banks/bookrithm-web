'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  // Shared style for nav links
  const navLink = 'text-sm text-zinc-400 transition-colors hover:text-zinc-50';

  return (
    <header className="border-b border-zinc-800 bg-black px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">

        {/* Logo — always links to home (/) which shows the right view based on auth */}
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Bookrithm
        </Link>

        {/* Right-side nav */}
        <nav className="flex items-center gap-6">
          {/* Always visible — /books is a public page */}
          <Link href="/books" className={navLink}>
            Browse Books
          </Link>

          {/* Only visible when logged in */}
          {user && (
            <>
              <Link href="/shelves" className={navLink}>
                My Shelves
              </Link>
              <Link href="/suggestions" className={navLink}>
                Suggest
              </Link>
              <Link href="/profile" className={navLink}>
                {user.displayName}
              </Link>
              <button onClick={signOut} className={navLink}>
                Sign out
              </button>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}