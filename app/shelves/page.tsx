'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { shelvesApi } from '@/lib/api/shelves';
import type { ShelfResponse } from '@/types/api';

export default function ShelvesPage() {

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [shelves, setShelves] = useState<ShelfResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    shelvesApi.getShelves()
      .then(data => setShelves(data))
      .catch(() => setError('Failed to load shelves. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading]);

    // Show nothing while auth is still being checked (avoids flicker)
  if (authLoading) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">

      {/* Page header */}
      <h1 className="text-2xl font-bold text-white">
        My Shelves
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {user?.displayName}'s reading collection
      </p>

      <div className="mt-8">

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 rounded bg-zinc-800" />
                    <div className="h-3 w-16 rounded bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Shelves list - only shown when loaded and no error */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-3">
            {shelves.map(shelf => (
              <Link
                key={shelf.id}
                href={`/shelves/${shelf.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 hover:bg-zinc-800 transition-colors"
              >
                <div>
                  <p className="font-medium text-zinc-50">
                    {shelf.name}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
                  </p>
                </div>

                {shelf.isSystem && (
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500">
                    default
                  </span>
                )}
              </Link>
            ))}

            {/* Empty state - if shelves loaded but array is empty */}
            {shelves.length === 0 && (
              <p className="text-sm text-zinc-400">No shelves found.</p>
            )}
          </div>
        )}

      </div>
    </main>
  );
}