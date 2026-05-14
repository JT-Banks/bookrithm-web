'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports
// useParams is the client-component way to read dynamic route segments.
// In Next.js App Router (this version), a Server Component receives params as a
// Promise prop, but Client Components (which need hooks) use useParams() instead.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { booksApi } from '@/lib/api/books';
import { shelvesApi } from '@/lib/api/shelves';
import { useAuth } from '@/lib/hooks/useAuth';
import { ReviewSection } from '@/components/features/ReviewSection';
import { SuggestionForm } from '@/components/features/SuggestionForm';
import type { BookResponse, CategoryWeightResponse, ShelfResponse } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Category weight bar sub-component
// Renders a single category with a visual weight bar (0–100).
// weight=100 = full bar. Like a health bar in a game.
// ─────────────────────────────────────────────────────────────────────────────
function CategoryBar({ item }: { item: CategoryWeightResponse }) {
  return (
    <div className="flex items-center gap-3">
      {/* Category name — fixed width so bars all start at the same x position */}
      <span className="text-zinc-300 text-sm w-40 shrink-0 truncate">
        {item.category.name}
      </span>

      {/* Track (background) + fill (foreground) — like a progress bar */}
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 rounded-full transition-all"
          style={{ width: `${item.weight}%` }}
        />
      </div>

      {/* Numeric weight */}
      <span className="text-zinc-500 text-xs w-8 text-right shrink-0">
        {item.weight}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function BookDetailPage() {
  // ── Read the :id from the URL ──────────────────────────────────────────────
  // useParams() returns an object with each dynamic segment as a key.
  // For app/books/[id]/page.tsx, params.id is the UUID from the URL.
  const params = useParams<{ id: string }>();
  const bookId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [book,       setBook]       = useState<BookResponse | null>(null);
  const [categories, setCategories] = useState<CategoryWeightResponse[]>([]);
  const [shelves,    setShelves]    = useState<ShelfResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Shelf selector state
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [isAdding,        setIsAdding]         = useState(false);
  const [addSuccess,      setAddSuccess]        = useState<string | null>(null);
  const [addError,        setAddError]          = useState<string | null>(null);

  // Whether the suggestion form is open (collapsed by default)
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // ── Fetch book data ────────────────────────────────────────────────────────
  // We kick off two parallel requests using Promise.allSettled — like calling
  // two @Async methods and waiting for both to complete.
  // allSettled (vs Promise.all) means if one fails, we still get the other result.
  useEffect(() => {
    if (!bookId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const [bookResult, categoriesResult] = await Promise.allSettled([
        booksApi.getBook(bookId),
        booksApi.getBookCategories(bookId),
      ]);

      if (bookResult.status === 'fulfilled') {
        setBook(bookResult.value);
      } else {
        setError('Book not found.');
      }

      if (categoriesResult.status === 'fulfilled') {
        // Guard against undefined/null — backend may return empty body if no categories
        const values = Array.isArray(categoriesResult.value) ? categoriesResult.value : [];
        const sorted = [...values].sort((a, b) => b.weight - a.weight);
        setCategories(sorted);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [bookId]);

  // ── Fetch user's shelves (only if logged in) ───────────────────────────────
  // Separate effect so it doesn't block the book from rendering.
  useEffect(() => {
    if (!user) return;

    shelvesApi.getShelves()
      .then((data) => {
        setShelves(data);
        // Pre-select the first shelf as a sensible default
        if (data.length > 0) setSelectedShelfId(data[0].id);
      })
      .catch(() => {
        // Not critical — shelf selector just won't appear
      });
  }, [user]);

  // ── Handle "Add to Shelf" button click ────────────────────────────────────
  const handleAddToShelf = async () => {
    if (!selectedShelfId) return;
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const result = await shelvesApi.setBookState(bookId, { shelfId: selectedShelfId });
      // result.shelfName comes from the API so we know which shelf it landed on
      setAddSuccess(`Added to "${result.shelfName}"`);
    } catch {
      setAddError('Could not add book to shelf. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Skeleton loader — animated placeholders while the book data fetches */}
        <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse mb-8" />
        <div className="flex flex-col sm:flex-row gap-8 mt-4">
          {/* Cover placeholder */}
          <div className="w-full sm:w-48 shrink-0">
            <div className="aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse" />
          </div>
          {/* Text placeholders */}
          <div className="flex flex-col gap-4 flex-1">
            <div className="h-8 w-3/4 rounded bg-zinc-800 animate-pulse" />
            <div className="h-5 w-1/3 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-full rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-red-400">{error ?? 'Something went wrong.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-zinc-400 hover:text-white"
        >
          ← Go back
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">

      {/* Back link */}
      <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-300 mb-8 inline-block">
        ← Back to Browse
      </Link>

      {/* ── Top section: cover + core info ── */}
      <div className="flex flex-col sm:flex-row gap-8 mt-4">

        {/* Cover image */}
        <div className="w-full sm:w-48 shrink-0">
          <div className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-zinc-600 text-sm">No cover</span>
            )}
          </div>
        </div>

        {/* Book info */}
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">{book.title}</h1>
            <p className="text-zinc-400 text-lg mt-1">{book.author}</p>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
              {book.maturity}
            </span>
            {book.isFanfiction && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-900 text-purple-300">
                Fanfiction
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-500">
              {book.source}
            </span>
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-zinc-400 leading-relaxed">{book.description}</p>
          )}

          {/* ── Add to Shelf section ── */}
          <div className="mt-2 pt-4 border-t border-zinc-800">
            {user ? (
              // Logged-in: show shelf dropdown + button
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-zinc-300">Add to Shelf</p>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Shelf picker — <select> is like a Java Enum combo box */}
                  <select
                    value={selectedShelfId}
                    onChange={(e) => setSelectedShelfId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
                  >
                    {shelves.map((shelf) => (
                      <option key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddToShelf}
                    disabled={isAdding || !selectedShelfId}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {isAdding ? 'Adding...' : 'Add to Shelf'}
                  </button>
                </div>

                {/* Feedback messages */}
                {addSuccess && <p className="text-green-400 text-sm">{addSuccess}</p>}
                {addError   && <p className="text-red-400 text-sm">{addError}</p>}
              </div>
            ) : (
              // Not logged in: prompt to sign in
              <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
                Sign in to add this book to a shelf →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Categories section ── */}
      {categories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
          <div className="flex flex-col gap-3 max-w-lg">
            {categories.map((item) => (
              <CategoryBar key={item.category.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews section ── */}
      <ReviewSection bookId={bookId} />

      {/* ── Suggest a category / trope / content warning ── */}
      {/* Only logged-in users can submit suggestions */}
      {user && (
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Suggest a Tag</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Help improve how this book is categorised.
              </p>
            </div>
            <button
              onClick={() => setShowSuggestionForm((prev) => !prev)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {showSuggestionForm ? 'Cancel' : '+ Suggest'}
            </button>
          </div>

          {showSuggestionForm && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              {/* Pass the bookId so the suggestion is linked to this specific book */}
              <SuggestionForm bookId={bookId} />
            </div>
          )}
        </section>
      )}

    </main>
  );
}
