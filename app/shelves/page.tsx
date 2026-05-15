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

  // New shelf inline form
  const [isCreating, setIsCreating]   = useState(false);
  const [newName,    setNewName]      = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSavingNew(true);
    setCreateError(null);
    try {
      const created = await shelvesApi.createShelf({ name: newName.trim() });
      setShelves(prev => [...prev, created]);
      setNewName('');
      setIsCreating(false);
    } catch {
      setCreateError('Failed to create shelf. Please try again.');
    } finally {
      setIsSavingNew(false);
    }
  };

  // Show nothing while auth is still being checked (avoids flicker)
  if (authLoading) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            My Shelves
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {user?.displayName}'s reading collection
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            + New Shelf
          </button>
        )}
      </div>

      <div className="mt-8">

        {/* New shelf inline form */}
        {isCreating && (
          <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-zinc-300">New shelf</p>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
              }}
              placeholder="Shelf name..."
              maxLength={80}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={isSavingNew || !newName.trim()}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
              >
                {isSavingNew ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewName(''); setCreateError(null); }}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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

                <div className="flex items-center gap-2">
                  {shelf.isPrivate && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-600" aria-label="Private shelf">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {shelf.isSystem && (
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500">
                      default
                    </span>
                  )}
                </div>
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