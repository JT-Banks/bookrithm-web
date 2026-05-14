'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports
// In Java, these are your import statements. React hooks are the key ones here:
//   useState  = like a mutable field that triggers a re-render when it changes
//   useEffect = like a @PostConstruct or a scheduled method — runs after render
//   useCallback = memoizes a function so it isn't re-created every render
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { booksApi } from '@/lib/api/books';
import type { BookResponse, BookPage } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Book Card sub-component
// Small, pure display component — no state, just props.
// In Java terms: a simple POJO renderer. Takes a BookResponse and returns JSX.
// ─────────────────────────────────────────────────────────────────────────────
// BookCard is now wrapped in a Link — clicking takes you to /books/:id
function BookCard({ book }: { book: BookResponse }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="bg-zinc-900 rounded-xl overflow-hidden flex flex-col hover:bg-zinc-800 transition-colors"
    >
      {/* Cover image */}
      <div className="h-56 bg-zinc-800 flex items-center justify-center">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-zinc-600 text-sm">No cover</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="text-white font-semibold leading-snug line-clamp-2">
          {book.title}
        </h3>
        <p className="text-zinc-400 text-sm">{book.author}</p>

        <div className="mt-auto pt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
            {book.maturity}
          </span>
          {book.isFanfiction && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-300">
              Fanfiction
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function BooksPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  // Think of each useState like a private field with a setter.
  // The component re-renders (like refreshing the UI) whenever one changes.
  const [query, setQuery]       = useState('');         // what the user typed
  const [debouncedQuery, setDebouncedQuery] = useState(''); // the delayed value we actually search with
  const [books, setBooks]       = useState<BookResponse[]>([]);
  const [page, setPage]         = useState<BookPage | null>(null); // holds pagination metadata
  const [currentPage, setCurrentPage] = useState(0);   // 0-indexed, matches the API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Debounce Effect ────────────────────────────────────────────────────────
  // "Debouncing" = wait for the user to stop typing before firing the search.
  // Without this, we'd call the API on every single keystroke.
  // This useEffect watches `query` and sets a 400ms timer.
  // If the user types again before 400ms, the timer resets (clearTimeout).
  // In Java, think of it like a ScheduledExecutorService that reschedules itself.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(0); // reset to page 0 when the search term changes
    }, 400);

    // This return function is the "cleanup" — runs when the effect fires again
    // (i.e. when query changes before the timer fires)
    return () => clearTimeout(timer);
  }, [query]); // ← only re-runs when `query` changes

  // ── Fetch Effect ───────────────────────────────────────────────────────────
  // useCallback memoizes the fetchBooks function so it has a stable reference.
  // Without this, it would be a new function object every render, which would
  // cause the useEffect below to run in an infinite loop.
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Only pass `q` if it's at least 2 chars (API minimum per the spec)
      const result = await booksApi.searchBooks({
        q: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
        page: currentPage,
        size: 20,
      });
      setBooks(result.content);
      setPage(result);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, currentPage]); // ← only changes when these change

  // This effect calls fetchBooks whenever debouncedQuery or currentPage changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">

      {/* Page header */}
      <h1 className="text-3xl font-bold text-white mb-2">Browse Books</h1>
      <p className="text-zinc-400 mb-8">Search the Bookrithm catalog</p>

      {/* Search bar */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full max-w-xl bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500 placeholder-zinc-500"
        />
        {/* Tip: show a hint when query is typed but < 2 chars */}
        {query.length === 1 && (
          <p className="text-zinc-500 text-sm mt-2">Type at least 2 characters to search</p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <p className="text-red-400 mb-6">{error}</p>
      )}

      {/* Loading skeleton — animated placeholder cards while fetching */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden animate-pulse">
              <div className="h-56 bg-zinc-800" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — only show when not loading */}
      {!isLoading && books.length === 0 && !error && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-14 text-center">
          <p className="text-zinc-300 font-medium mb-1">
            {debouncedQuery.length >= 2
              ? `No books found for "${debouncedQuery}"`
              : 'No books in the catalog yet.'}
          </p>
          {debouncedQuery.length >= 2 && (
            <p className="text-zinc-500 text-sm mt-1">Try a different title or author name.</p>
          )}
        </div>
      )}

      {/* Book grid */}
      {!isLoading && books.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {books.map((book) => (
              // key= is required by React when rendering a list — like a Map key.
              // It helps React track which items changed/moved/were removed.
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Pagination — only render if there's more than one page */}
          {page && page.page.totalPages > 1 && (
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>

              <span className="text-zinc-400 text-sm">
                Page {currentPage + 1} of {page.page.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(page.page.totalPages - 1, p + 1))}
                disabled={currentPage >= page.page.totalPages - 1}
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
