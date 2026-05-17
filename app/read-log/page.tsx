'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Reading History page — /read-log
// Shows the authenticated user's chronological log of books they've marked
// as read, newest first. Paginated.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { shelvesApi } from '@/lib/api/shelves';
import type { ReadLogEntry } from '@/types/api';

// ── ReadLogCard ────────────────────────────────────────────────────────────────
// Displays a single "book finished" entry.
function ReadLogCard({ entry }: { entry: ReadLogEntry }) {
  const completedDate = new Date(entry.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          href={`/books/${entry.bookId}`}
          className="font-medium text-zinc-50 hover:text-white hover:underline truncate"
        >
          {entry.bookTitle ?? 'Untitled'}
        </Link>
        <p className="text-xs text-zinc-500">Finished {completedDate}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function ReadLogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [entries,      setEntries]      = useState<ReadLogEntry[]>([]);
  const [currentPage,  setCurrentPage]  = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    setIsLoading(true);
    setError(null);

    shelvesApi.getReadLog(currentPage)
      .then((data) => {
        setEntries(data.content);
        setTotalPages(data.page.totalPages);
      })
      .catch(() => setError('Failed to load reading history. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading, currentPage]);

  if (authLoading) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reading History</h1>
        <p className="text-zinc-500 text-sm mt-1">Every book you've marked as finished</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 animate-pulse"
            >
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 rounded bg-zinc-800" />
                <div className="h-3 w-28 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400">{error}</p>}

      {/* Empty state */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-4">No reading history yet.</p>
          <p className="text-zinc-600 text-sm">
            Open any shelf and hit{' '}
            <span className="text-zinc-400">Mark read</span> on a book to start tracking.
          </p>
        </div>
      )}

      {/* Entry list */}
      {!isLoading && entries.length > 0 && (
        <>
          <div className="flex flex-col gap-3 mb-8">
            {entries.map((entry) => (
              <ReadLogCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-zinc-400 text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

    </main>
  );
}
