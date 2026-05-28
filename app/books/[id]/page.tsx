'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { booksApi } from '@/lib/api/books';
import { shelvesApi } from '@/lib/api/shelves';
import { useAuth } from '@/lib/hooks/useAuth';
import { ReviewSection } from '@/components/features/ReviewSection';
import { SuggestionForm } from '@/components/features/SuggestionForm';
import type { BookResponse, CategoryWeightResponse, ReviewResponse, ShelfResponse } from '@/types/api';

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TagPill({ item }: { item: CategoryWeightResponse }) {
  return (
    <Link
      href={`/books?categoryId=${item.category.id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-amber-600/60 hover:text-white"
    >
      {item.category.name}
      {item.weight > 0 && (
        <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
          {item.weight}%
        </span>
      )}
    </Link>
  );
}

// ── Review summary bar (amber filled) ────────────────────────────────────────
function SummaryBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-zinc-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-[#d6a84f]"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm text-zinc-300">{value.toFixed(1)}/10</span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSource(source: string) {
  return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const SUMMARY_DIMS = [
  { key: 'overall'      as const, label: 'Overall' },
  { key: 'storytelling' as const, label: 'Storytelling' },
  { key: 'characters'   as const, label: 'Characters' },
  { key: 'worldbuilding'as const, label: 'Worldbuilding' },
  { key: 'pacing'       as const, label: 'Pacing' },
  { key: 'grammar'      as const, label: 'Grammar' },
];

// ── Main page component ───────────────────────────────────────────────────────
export default function BookDetailPage() {
  const params   = useParams<{ id: string }>();
  const bookId   = params.id;
  const router   = useRouter();
  const { user } = useAuth();

  const reviewSectionRef = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [book,       setBook]       = useState<BookResponse | null>(null);
  const [categories, setCategories] = useState<CategoryWeightResponse[]>([]);
  const [shelves,    setShelves]    = useState<ShelfResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState(false);

  // Reviews — lifted here so we can compute the summary in the page layout
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);

  // Controls the ReviewSection's write form (triggered by header button)
  const [openReviewForm, setOpenReviewForm] = useState(false);

  // Shelf selector state
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [isAdding,        setIsAdding]         = useState(false);
  const [addSuccess,      setAddSuccess]        = useState<string | null>(null);
  const [addError,        setAddError]          = useState<string | null>(null);

  // Suggestion form toggle (in Categories & Tags card)
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // ── Computed: review summary averages ─────────────────────────────────────
  const reviewSummary = useMemo(() => {
    if (reviews.length === 0) return null;
    const result: Partial<Record<typeof SUMMARY_DIMS[number]['key'], number>> = {};
    for (const dim of SUMMARY_DIMS) {
      const vals = reviews.map(r => r[dim.key]).filter((v): v is number => v != null);
      if (vals.length > 0) result[dim.key] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    return result;
  }, [reviews]);

  const avgScore   = reviewSummary?.overall ?? null;
  const reviewCount = reviews.length;

  // ── Fetch book + categories ────────────────────────────────────────────────
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
        const values = Array.isArray(categoriesResult.value) ? categoriesResult.value : [];
        setCategories([...values].sort((a, b) => b.weight - a.weight));
      } else {
        setCategoriesError(true);
      }

      setIsLoading(false);
    };
    fetchData();
  }, [bookId]);

  // ── Fetch user's shelves ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    shelvesApi.getShelves()
      .then((data) => {
        setShelves(data);
        if (data.length > 0) setSelectedShelfId(data[0].id);
      })
      .catch(() => {});
  }, [user]);

  // ── Add to Shelf ───────────────────────────────────────────────────────────
  const handleAddToShelf = async () => {
    if (!selectedShelfId) return;
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const result = await shelvesApi.setBookState(bookId, { shelfId: selectedShelfId });
      setAddSuccess(`Added to "${result.shelfName}"`);
    } catch {
      setAddError('Could not add book to shelf. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // ── Write Review (from header button) ─────────────────────────────────────
  const handleWriteReview = () => {
    setOpenReviewForm(true);
    setTimeout(() => reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0602] px-6 py-8">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="flex gap-8 rounded-2xl border border-amber-900/20 bg-[#120804] p-7">
            <div className="aspect-[2/3] w-44 shrink-0 animate-pulse rounded-xl bg-zinc-800" />
            <div className="flex flex-1 flex-col gap-4 pt-2">
              <div className="h-9 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#0c0602] px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-red-400">{error ?? 'Something went wrong.'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-zinc-400 hover:text-white">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // Header pills: maturity + first 5 category tags
  const headerPills = [
    book.maturity.replace(/_/g, ' '),
    ...categories.slice(0, 5).map(c => c.category.name),
    ...(book.isFanfiction ? ['Fanfiction'] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0c0602]">
      <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-5">

        {/* Back link */}
        <Link href="/books" className="inline-block text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to Browse
        </Link>

        {/* ── MAIN BOOK CARD ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-amber-900/20 bg-[#120804] p-7">
          <div className="flex gap-8">

            {/* Cover */}
            <div className="w-44 shrink-0">
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-600">No cover</div>
                )}
              </div>
            </div>

            {/* Title / author / pills / description / metadata */}
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold leading-tight text-white">{book.title}</h1>
              <p className="mt-1 text-xl text-[#d6a84f]">{book.author}</p>

              {/* Category pill row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {headerPills.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Description — clamped to 4 lines */}
              {book.description && (
                <p className="mt-4 line-clamp-4 leading-relaxed text-zinc-400">
                  {book.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
                <span>Source: {formatSource(book.source)}</span>
                {book.isbn13 && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span>ISBN: {book.isbn13}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right panel: score + shelf actions */}
            <div className="flex w-52 shrink-0 flex-col gap-3">

              {/* Bookrithm Score */}
              <div className="rounded-xl border border-amber-900/20 bg-[#0c0602] p-4 text-center">
                <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Bookrithm Score</p>
                {avgScore != null ? (
                  <>
                    <p className="text-4xl font-bold text-[#d6a84f]">
                      {avgScore.toFixed(1)}
                      <span className="text-lg text-zinc-500">/10</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-zinc-700">—</p>
                )}
              </div>

              {user ? (
                <>
                  {/* Shelf selector + Add button */}
                  <div className="flex gap-2">
                    <select
                      value={selectedShelfId}
                      onChange={(e) => setSelectedShelfId(e.target.value)}
                      disabled={shelves.length === 0}
                      className="library-select min-w-0 flex-1 rounded-lg border border-amber-900/30 bg-[#0c0602] px-3 py-2 text-sm text-zinc-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {shelves.length === 0 ? (
                        <option value="">No shelves</option>
                      ) : (
                        shelves.map((shelf) => (
                          <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={handleAddToShelf}
                      disabled={isAdding || !selectedShelfId}
                      className="shrink-0 rounded-lg bg-[#d6a84f] px-3 py-2 text-sm font-semibold text-[#0c0602] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isAdding ? '...' : 'Add'}
                    </button>
                  </div>
                  {addSuccess && <p className="text-xs text-green-400">{addSuccess}</p>}
                  {addError   && <p className="text-xs text-red-400">{addError}</p>}

                  {/* Write a Review */}
                  <button
                    onClick={handleWriteReview}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#0c0602] px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                    Write a Review
                  </button>
                </>
              ) : (
                <Link href="/" className="mt-2 text-center text-sm text-zinc-500 hover:text-zinc-300">
                  Sign in to add to a shelf →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN: Categories & Tags | Review Summary ─────────────── */}
        <div className="grid grid-cols-[45fr_55fr] gap-5">

          {/* Categories & Tags */}
          <div className="rounded-2xl border border-amber-900/20 bg-[#120804] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#d6a84f]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories &amp; Tags
            </h2>

            {categoriesError ? (
              <p className="text-sm text-zinc-600">Could not load tags.</p>
            ) : categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <TagPill key={item.category.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No tags have been approved for this book yet.</p>
            )}

            {/* Suggest a Tag */}
            {user && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSuggestionForm((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <span>+</span> Suggest a Tag
                </button>
                {showSuggestionForm && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-[#0c0602] p-4">
                    <SuggestionForm bookId={bookId} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Review Summary */}
          <div className="flex gap-4 rounded-2xl border border-amber-900/20 bg-[#120804] p-6">
            <div className="flex-1">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#d6a84f]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Review Summary
              </h2>

              {reviewSummary ? (
                <div className="flex flex-col gap-2.5">
                  {SUMMARY_DIMS.map((dim) =>
                    reviewSummary[dim.key] != null ? (
                      <SummaryBar key={dim.key} label={dim.label} value={reviewSummary[dim.key]!} />
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No reviews yet.</p>
              )}
            </div>

            {/* Score side panel */}
            {avgScore != null && (
              <div className="flex w-32 shrink-0 flex-col items-center justify-center rounded-xl border border-amber-900/20 bg-[#0c0602] p-4 text-center">
                <p className="text-3xl font-bold text-[#d6a84f]">
                  {avgScore.toFixed(1)}
                  <span className="text-base text-zinc-500">/10</span>
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-400">Bookrithm Score</p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </p>
                <button
                  onClick={() => reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="mt-3 text-xs text-[#d6a84f] hover:underline"
                >
                  View All Reviews
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── REVIEWS ────────────────────────────────────────────────────── */}
        <div ref={reviewSectionRef} className="rounded-2xl border border-amber-900/20 bg-[#120804] p-6">
          <ReviewSection
            bookId={bookId}
            autoOpenForm={openReviewForm}
            onFormOpened={() => setOpenReviewForm(false)}
            onReviewsChange={setReviews}
          />
        </div>

      </div>
    </div>
  );
}
