'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { shelvesApi } from '@/lib/api/shelves';
import { useAuth } from '@/lib/hooks/useAuth';
import type { UserBookStateResponse, ShelfResponse } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// ShelfBookCard — displays one entry from a shelf.
// UserBookStateResponse tells us bookId, bookTitle, position, and when it
// was added. We link through to the book detail page using bookId.
// ─────────────────────────────────────────────────────────────────────────────
function ShelfBookCard({ item, onRemove }: {
  item: UserBookStateResponse;
  onRemove: (bookId: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    onRemove(item.bookId);
  };

  // Format the addedAt ISO string into a readable date.
  // Intl.DateTimeFormat is the browser-native equivalent of Java's DateTimeFormatter.
  const addedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(item.addedAt));

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <div className="flex flex-col gap-1 min-w-0">
        {/* Link to the full book detail page */}
        <Link
          href={`/books/${item.bookId}`}
          className="font-medium text-zinc-50 hover:text-white hover:underline truncate"
        >
          {item.bookTitle ?? 'Untitled'}
        </Link>
        <p className="text-xs text-zinc-500">Added {addedDate}</p>
      </div>

      {/* Remove button — takes the book off this shelf entirely */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="ml-4 shrink-0 text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {removing ? 'Removing...' : 'Remove'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShelfDetailPage — the main page component.
// Route: /shelves/[id]
// ─────────────────────────────────────────────────────────────────────────────
export default function ShelfDetailPage() {
  const params  = useParams<{ id: string }>();
  const shelfId = params.id;
  const router  = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [books,       setBooks]       = useState<UserBookStateResponse[]>([]);
  const [shelf,       setShelf]       = useState<ShelfResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // ── Fetch the shelf name ───────────────────────────────────────────────────
  // We fetch all shelves and find the matching one to get the shelf name.
  // This is a small call and the data is already available on the server.
  useEffect(() => {
    if (!user) return;
    shelvesApi.getShelves()
      .then((data) => {
        const found = data.find((s) => s.id === shelfId);
        if (found) setShelf(found);
      })
      .catch(() => {/* non-critical — page title just won't show */});
  }, [user, shelfId]);

  // ── Fetch books on this shelf ──────────────────────────────────────────────
  useEffect(() => {
    if (!user || authLoading) return;

    setIsLoading(true);
    setError(null);

    shelvesApi.getShelfBooks(shelfId, currentPage)
      .then((data) => {
        setBooks(data.content);
        setTotalPages(data.page.totalPages);
      })
      .catch(() => setError('Failed to load books. Please try again.'))
      .finally(() => setIsLoading(false));

  // Re-fetch whenever the page changes or the user navigates here
  }, [user, authLoading, shelfId, currentPage]);

  // ── Remove a book from this shelf ─────────────────────────────────────────
  // Optimistic update: remove from local state immediately, then call the API.
  // "Optimistic" means we assume success and update the UI right away.
  // If the API call fails, we'd ideally restore the item — keeping it simple here.
  const handleRemove = async (bookId: string) => {
    // Remove from the displayed list immediately (optimistic)
    setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
    try {
      await shelvesApi.removeBookState(bookId);
    } catch {
      // If it failed, re-fetch to restore correct state
      shelvesApi.getShelfBooks(shelfId, currentPage)
        .then((data) => setBooks(data.content))
        .catch(() => {});
    }
  };

  if (authLoading) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">

      {/* Back link */}
      <Link href="/shelves" className="text-sm text-zinc-500 hover:text-zinc-300 mb-8 inline-block">
        ← My Shelves
      </Link>

      {/* Page header */}
      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold text-white">
          {shelf?.name ?? 'Shelf'}
        </h1>
        {shelf && (
          <p className="text-zinc-500 text-sm mt-1">
            {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 animate-pulse">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 rounded bg-zinc-800" />
                <div className="h-3 w-24 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400">{error}</p>}

      {/* Empty state */}
      {!isLoading && !error && books.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-4">No books on this shelf yet.</p>
          <Link
            href="/books"
            className="text-sm text-zinc-300 hover:text-white underline"
          >
            Browse books to add some →
          </Link>
        </div>
      )}

      {/* Book list */}
      {!isLoading && books.length > 0 && (
        <>
          <div className="flex flex-col gap-3 mb-8">
            {books.map((item) => (
              <ShelfBookCard
                key={item.bookId}
                item={item}
                onRemove={handleRemove}
              />
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
