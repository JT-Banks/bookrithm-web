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
import { useRouter, useSearchParams } from 'next/navigation';
import { booksApi } from '@/lib/api/books';
import { categoriesApi } from '@/lib/api/categories';
import type { BookResponse, BookPage, CategoryResponse, BookSortBy } from '@/types/api';

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
      className="group bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:border-amber-900/60 hover:bg-zinc-900/65 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-zinc-950/60"
    >
      {/* Cover image */}
      <div className="relative h-56 bg-zinc-800/80 flex items-center justify-center overflow-hidden">
        {book.coverUrl ? (
          <>
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
            {/* Gradient bleeds cover into card body — eliminates the harsh line */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-xs">No cover</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="text-zinc-100 font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {book.title}
        </h3>
        <p className="text-zinc-500 text-sm">{book.author}</p>

        <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {book.maturity}
          </span>
          {book.isFanfiction && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300">
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
  const router = useRouter();
  // useSearchParams lets us read ?categoryId=... from the URL on initial load,
  // so a link like /books?categoryId=<uuid> (from the book detail page) arrives
  // with the filter already active.
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [query, setQuery]       = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [books, setBooks]       = useState<BookResponse[]>([]);
  const [page, setPage]         = useState<BookPage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Category filter state ──────────────────────────────────────────────────
  const [allCategories,    setAllCategories]    = useState<CategoryResponse[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    searchParams.get('categoryId'),
  );
  const [sortBy, setSortBy] = useState<BookSortBy>('READS');

  // Load the full category list once on mount (used for the filter pill row)
  useEffect(() => {
    categoriesApi.listCategories()
      .then((data) => setAllCategories(data.content))
      .catch(() => {}); // non-critical — filter pills just won't appear
  }, []);

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
      const result = await booksApi.searchBooks({
        q: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
        page: currentPage,
        size: 20,
        categoryId: activeCategoryId ?? undefined,
        sortBy,
      });
      setBooks(result.content);
      setPage(result);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, currentPage, activeCategoryId, sortBy]);

  // This effect calls fetchBooks whenever debouncedQuery or currentPage changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">

      {/* Page header */}
      <h1 className="text-3xl font-bold text-white mb-2">Browse Books</h1>
      <p className="text-zinc-400 mb-8">
        {debouncedQuery.length >= 2
          ? `Results for "${debouncedQuery}"`
          : activeCategoryId
          ? 'Filtered by category'
          : sortBy === 'READS' ? 'Most read in the catalog' : 'Most shelved in the catalog'}
      </p>

      {/* ── Search + filter bar ── */}
      <div className="mb-8 flex flex-col gap-3">
        {/* Sort toggle — only meaningful when not doing a text search */}
        {debouncedQuery.length < 2 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Sort:</span>
            {(['READS', 'SHELVED'] as BookSortBy[]).map((option) => (
              <button
                key={option}
                onClick={() => { setSortBy(option); setCurrentPage(0); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sortBy === option
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {option === 'READS' ? 'Most read' : 'Most shelved'}
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full max-w-xl bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500 placeholder-zinc-500"
        />
        {query.length === 1 && (
          <p className="text-zinc-500 text-sm">Type at least 2 characters to search</p>
        )}

        {/* Category filter — only rendered once categories have loaded */}
        {allCategories.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-zinc-500">Filter by category:</span>

            {/* "All" pill — clears the filter */}
            <button
              onClick={() => {
                setActiveCategoryId(null);
                setCurrentPage(0);
                router.replace('/books'); // remove ?categoryId from URL
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategoryId === null
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              All
            </button>

            {/* One pill per category */}
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setCurrentPage(0);
                  router.replace(`/books?categoryId=${cat.id}`);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategoryId === cat.id
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
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
            {debouncedQuery.length >= 2 && activeCategoryId
              ? `No books found for "${debouncedQuery}" in this category`
              : debouncedQuery.length >= 2
              ? `No books found for "${debouncedQuery}"`
              : activeCategoryId
              ? 'No books tagged with this category yet.'
              : 'No books in the catalog yet.'}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            {activeCategoryId
              ? 'Try clearing the category filter or searching with different terms.'
              : debouncedQuery.length >= 2
              ? 'Try a different title or author name.'
              : ''}
          </p>
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
