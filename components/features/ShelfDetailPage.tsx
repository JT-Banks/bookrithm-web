'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { shelvesApi } from '@/lib/api/shelves';
import { useAuth } from '@/lib/hooks/useAuth';
import type { UserBookStateResponse, ShelfResponse } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// ShelfBookCard — displays one entry from a shelf.
// ─────────────────────────────────────────────────────────────────────────────
function ShelfBookCard({ item, onRemove, onMarkRead }: {
  item: UserBookStateResponse;
  onRemove:   (bookId: string) => void;
  onMarkRead: (bookId: string) => Promise<void>;
}) {
  const [removing, setRemoving] = useState(false);
  const [marking,  setMarking]  = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    onRemove(item.bookId);
  };

  const handleMarkRead = async () => {
    setMarking(true);
    try { await onMarkRead(item.bookId); } finally { setMarking(false); }
  };

  const addedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(item.addedAt));

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          href={`/books/${item.bookId}`}
          className="font-medium text-zinc-50 hover:text-white hover:underline truncate"
        >
          {item.bookTitle ?? 'Untitled'}
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-500">Added {addedDate}</p>
          {(item.readCount ?? 0) > 0 && (
            <span className="text-xs text-zinc-600">Read {item.readCount}×</span>
          )}
        </div>
      </div>

      <div className="ml-4 shrink-0 flex items-center gap-4">
        <button
          onClick={handleMarkRead}
          disabled={marking}
          className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-40"
        >
          {marking ? 'Saving…' : 'Mark read'}
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {removing ? 'Removing...' : 'Remove'}
        </button>
      </div>
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
  const [books,              setBooks]             = useState<UserBookStateResponse[]>([]);
  const [shelf,              setShelf]             = useState<ShelfResponse | null>(null);
  const [currentPage,        setCurrentPage]       = useState(0);
  const [totalPages,         setTotalPages]        = useState(1);
  const [isLoading,          setIsLoading]         = useState(true);
  const [error,              setError]             = useState<string | null>(null);
  const [isTogglingPrivacy,  setIsTogglingPrivacy] = useState(false);
  const [isDeleting,         setIsDeleting]        = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // ── Fetch the shelf name ───────────────────────────────────────────────────
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
  const handleRemove = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
    try {
      await shelvesApi.removeBookState(bookId);
    } catch {
      shelvesApi.getShelfBooks(shelfId, currentPage)
        .then((data) => setBooks(data.content))
        .catch(() => {});
    }
  };

  // ── Mark a book as read ───────────────────────────────────────────────────────────────────────────
  const handleMarkRead = async (bookId: string) => {
    await shelvesApi.markAsRead(bookId);
    // Optimistically increment the local read count so the UI updates instantly
    setBooks((prev) =>
      prev.map((b) =>
        b.bookId === bookId ? { ...b, readCount: (b.readCount ?? 0) + 1 } : b
      )
    );
  };

  // ── Toggle shelf privacy ───────────────────────────────────────────────────────────────────────────
  const handleTogglePrivacy = async () => {
    if (!shelf || shelf.isSystem) return;
    setIsTogglingPrivacy(true);
    try {
      const updated = await shelvesApi.updateShelf(shelfId, { isPrivate: !shelf.isPrivate });
      setShelf(updated);
    } catch { /* non-critical */ } finally {
      setIsTogglingPrivacy(false);
    }
  };

  // ── Delete custom shelf ───────────────────────────────────────────────────────────────────────────
  const handleDeleteShelf = async () => {
    if (!shelf || shelf.isSystem) return;
    setIsDeleting(true);
    try {
      await shelvesApi.deleteShelf(shelfId);
      router.push('/shelves');
    } catch {
      setIsDeleting(false);
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
        {/* Privacy + delete controls for custom shelves only */}
        {shelf && !shelf.isSystem && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleTogglePrivacy}
              disabled={isTogglingPrivacy}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
            >
              {shelf.isPrivate ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5a3 3 0 016 0v2.25a.75.75 0 001.5 0V5.5A4.5 4.5 0 0010 1z" />
                </svg>
              )}
              {isTogglingPrivacy ? 'Saving…' : shelf.isPrivate ? 'Private' : 'Public'}
            </button>
            <span className="text-zinc-700">·</span>
            <button
              onClick={handleDeleteShelf}
              disabled={isDeleting}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {isDeleting ? 'Deleting…' : 'Delete shelf'}
            </button>
          </div>
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
                onMarkRead={handleMarkRead}
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
