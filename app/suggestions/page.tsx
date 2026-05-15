'use client';

// ─────────────────────────────────────────────────────────────────────────────
// My Suggestions page — /suggestions
// Shows the logged-in user's own submission history, paginated.
// Each card shows the suggestion type, name (from payload), status badge,
// and when it was submitted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { suggestionsApi } from '@/lib/api/suggestions';
import { SuggestionForm } from '@/components/features/SuggestionForm';
import type { SuggestionResponse, SuggestionType, SuggestionStatus } from '@/types/api';

// ── Badge colours for each status ─────────────────────────────────────────────
// Like a Java Map<SuggestionStatus, String> of CSS class names
const STATUS_STYLES: Record<SuggestionStatus, string> = {
  PENDING:  'bg-yellow-900/50 text-yellow-300',
  APPROVED: 'bg-green-900/50  text-green-300',
  REJECTED: 'bg-red-900/50    text-red-300',
};

// Friendly display labels for each type
const TYPE_LABELS: Record<SuggestionType, string> = {
  CATEGORY:        'Category',
  TROPE:           'Trope',
  CONTENT_WARNING: 'Content Warning',
};

// ── SuggestionCard ─────────────────────────────────────────────────────────────
// Displays a single suggestion from the user's history.
function SuggestionCard({ suggestion }: { suggestion: SuggestionResponse }) {
  // Extract the name from the payload — the backend stores name there
  const name = (suggestion.payload?.name as string | undefined) ?? '—';
  const description = suggestion.payload?.description as string | undefined;

  // Format the date for display (ISO → readable)
  const submittedAt = new Date(suggestion.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 flex flex-col gap-2">

      {/* Top row: type label + status badge */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
          {TYPE_LABELS[suggestion.type]}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[suggestion.status]}`}>
          {suggestion.status}
        </span>
      </div>

      {/* Suggestion name */}
      <p className="font-medium text-zinc-100">{name}</p>

      {/* Linked book — thumbnail + title linking to the book detail page */}
      {suggestion.book && (
        <Link
          href={`/books/${suggestion.book.id}`}
          className="mt-1 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 hover:border-zinc-600 transition-colors w-full"
        >
          {/* Cover thumbnail */}
          <div className="h-12 w-9 shrink-0 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
            {suggestion.book.coverUrl ? (
              <img
                src={suggestion.book.coverUrl}
                alt={suggestion.book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-zinc-600 text-xs">?</span>
            )}
          </div>

          {/* Book title */}
          <span className="text-sm font-medium text-zinc-300 hover:text-white transition-colors line-clamp-2">
            {suggestion.book.title}
          </span>
        </Link>
      )}

      {/* Optional description */}
      {description && (
        <p className="text-sm text-zinc-400">{description}</p>
      )}

      {/* AI feedback (only shown after AI has reviewed it) */}
      {suggestion.aiReason && (
        <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
          <p className="text-xs text-zinc-500 mb-1">AI review</p>
          <p className="text-xs text-zinc-400">{suggestion.aiReason}</p>
          {suggestion.aiConfidence != null && (
            <p className="text-xs text-zinc-600 mt-1">
              Confidence: {suggestion.aiConfidence}%
            </p>
          )}
        </div>
      )}

      {/* Submitted date */}
      <p className="text-xs text-zinc-600">{submittedAt}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function SuggestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // ── Submission history state ────────────────────────────────────────────────
  const [suggestions, setSuggestions]   = useState<SuggestionResponse[]>([]);
  const [isLoading,   setIsLoading]     = useState(true);
  const [error,       setError]         = useState<string | null>(null);
  const [page,        setPage]          = useState(0);
  const [totalPages,  setTotalPages]    = useState(0);

  // Whether the "Submit a suggestion" form is expanded
  const [showForm, setShowForm] = useState(false);

  // ── Redirect if not logged in ───────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // ── Fetch suggestion history ────────────────────────────────────────────────
  // Re-runs when the page number changes (pagination).
  useEffect(() => {
    if (authLoading || !user) return;

    setIsLoading(true);
    setError(null);

    suggestionsApi.getSuggestions(page)
      .then((data) => {
        setSuggestions(data.content);
        setTotalPages(data.page.totalPages);
      })
      .catch(() => setError('Failed to load suggestions. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading, page]);

  // Show nothing during the auth check to avoid a flash of the redirect
  if (authLoading) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Suggestions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Suggest new categories, tropes, and content warnings for the platform.
          </p>
        </div>

        {/* Toggle form button */}
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="shrink-0 rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Suggestion'}
        </button>
      </div>

      {/* ── Suggestion submission form (collapsible) ── */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Submit a Suggestion</h2>
          <SuggestionForm />
        </div>
      )}

      {/* ── Submission history ── */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Submission History</h2>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-3 w-20 rounded bg-zinc-800" />
                  <div className="h-3 w-16 rounded bg-zinc-800" />
                </div>
                <div className="h-4 w-48 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Empty state — no submissions yet */}
        {!isLoading && !error && suggestions.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-10 text-center">
            <p className="text-zinc-400">You haven't submitted any suggestions yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
            >
              Submit your first suggestion
            </button>
          </div>
        )}

        {/* Suggestion cards */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}

        {/* ── Pagination controls ── */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-zinc-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </section>

    </main>
  );
}
