'use client';

import { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/lib/hooks/useAuth';
import type { ReviewResponse, ReviewRequest } from '@/types/api';

// Props for the top-level ReviewSection exported component
interface ReviewSectionProps {
  bookId: string;
  // When true, automatically opens the write-review form (e.g. triggered by
  // the "Write a Review" button in the book header).
  autoOpenForm?: boolean;
  // Called once after the form has been opened so the parent can reset the flag.
  onFormOpened?: () => void;
  // Fires whenever the reviews array changes so the parent can compute summary stats.
  onReviewsChange?: (reviews: ReviewResponse[]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score dimensions — each review can rate up to 6 aspects of a book.
// We define them here so the form and display both use the same labels/keys.
// The key maps directly to the field name in ReviewRequest / ReviewResponse.
// ─────────────────────────────────────────────────────────────────────────────
const DIMENSIONS: { key: keyof ReviewRequest & string; label: string }[] = [
  { key: 'overall',      label: 'Overall' },
  { key: 'storytelling', label: 'Storytelling' },
  { key: 'characters',   label: 'Characters' },
  { key: 'worldbuilding',label: 'World­building' },
  { key: 'pacing',       label: 'Pacing' },
  { key: 'grammar',      label: 'Grammar' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ScorePicker — 11 clickable buttons (0–10). Click the active one to deselect.
// Used for each score dimension in the review form.
// ─────────────────────────────────────────────────────────────────────────────
function ScorePicker({ value, onChange }: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i ? null : i)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
            ${value === i
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

// ── MiniBar — compact dimension bar used inside a review card ────────────────
function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-zinc-500">{label}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-[#d6a84f]/70"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs text-zinc-400">{value}/10</span>
    </div>
  );
}

// ── ReviewCard — displays one submitted review ────────────────────────────────
function ReviewCard({ review, isOwn, currentUserDisplayName, onEdit, onDelete }: {
  review: ReviewResponse;
  isOwn: boolean;
  currentUserDisplayName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete();
  };

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(review.createdAt));

  const displayName = isOwn
    ? (currentUserDisplayName ?? 'You')
    : review.isAnonymous
    ? 'Anonymous'
    : 'Community';

  const initial = displayName[0].toUpperCase();

  // Dimension bars (exclude overall — shown as the big number)
  const dimBars = DIMENSIONS.filter(
    (d) => d.key !== 'overall' && review[d.key as keyof ReviewResponse] != null
  );

  return (
    <div className="flex items-start gap-5 rounded-xl border border-zinc-800/60 bg-[#0c0602]/60 p-5">
      {/* Avatar + name + date */}
      <div className="flex w-20 shrink-0 flex-col items-center gap-1 pt-0.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
          {initial}
        </div>
        <span className="text-center text-xs font-medium text-zinc-300">{displayName}</span>
        <span className="text-center text-xs text-zinc-600">{date}</span>
      </div>

      {/* Big overall score */}
      {review.overall != null && (
        <div className="shrink-0 pt-1 text-right">
          <span className="text-3xl font-bold text-[#d6a84f]">{review.overall}</span>
          <span className="text-base text-zinc-500">/10</span>
        </div>
      )}

      {/* Dimension mini-bars */}
      {dimBars.length > 0 && (
        <div className="shrink-0 flex flex-col gap-1.5 pt-1">
          {dimBars.map((d) => (
            <MiniBar
              key={d.key}
              label={d.label}
              value={review[d.key as keyof ReviewResponse] as number}
            />
          ))}
        </div>
      )}

      {/* Review text */}
      <div className="min-w-0 flex-1 pt-1">
        {review.reviewText ? (
          <p className="text-sm leading-relaxed text-zinc-300">{review.reviewText}</p>
        ) : (
          <p className="text-sm italic text-zinc-600">No written review.</p>
        )}

        {/* Owner actions */}
        {isOwn && (
          <div className="mt-3 flex gap-3">
            <button onClick={onEdit} className="text-xs text-zinc-500 transition-colors hover:text-white">
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-40"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewForm — the write/edit form. Used for both creating and updating.
// Props:
//   initial    = pre-filled values when editing an existing review
//   onSubmit   = called with the form data when Save is clicked
//   onCancel   = called when Cancel is clicked
// ─────────────────────────────────────────────────────────────────────────────
function ReviewForm({ initial, onSubmit, onCancel }: {
  initial?: ReviewResponse;
  onSubmit: (data: ReviewRequest) => Promise<void>;
  onCancel: () => void;
}) {
  // Build initial score state from the existing review (if editing)
  // Each score starts as null (= not rated) unless the review already has a value
  const initScores = () => Object.fromEntries(
    DIMENSIONS.map(d => [d.key, initial?.[d.key as keyof ReviewResponse] ?? null])
  ) as Record<string, number | null>;

  const [scores,     setScores]     = useState(initScores);
  const [reviewText, setReviewText] = useState(initial?.reviewText ?? '');
  const [isAnonymous, setIsAnonymous] = useState(initial?.isAnonymous ?? false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    // Build the request — only include scores that were set (not null)
    const body: ReviewRequest = {
      ...Object.fromEntries(
        Object.entries(scores).filter(([, v]) => v !== null)
      ),
      reviewText: reviewText.trim() || undefined,
      isAnonymous,
    };

    try {
      await onSubmit(body);
    } catch {
      setError('Could not save review. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-zinc-700/60 bg-[#0c0602] p-5">
      <p className="text-sm font-medium text-zinc-200">
        {initial ? 'Edit your review' : 'Write a review'}
      </p>

      {/* Score pickers — one row per dimension */}
      {DIMENSIONS.map(d => (
        <div key={d.key} className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">{d.label}</span>
          <ScorePicker
            value={scores[d.key]}
            onChange={(v) => setScores(prev => ({ ...prev, [d.key]: v }))}
          />
        </div>
      ))}

      {/* Review text */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Review text (optional)</span>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 accent-zinc-400 cursor-pointer"
        />
        <span className="text-sm text-zinc-400">Post anonymously</span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-lg bg-[#d6a84f] px-4 py-2 text-sm font-semibold text-[#0c0602] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Review'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewSection — the top-level component dropped into the book detail page.
// ─────────────────────────────────────────────────────────────────────────────
export function ReviewSection({
  bookId,
  autoOpenForm,
  onFormOpened,
  onReviewsChange,
}: ReviewSectionProps) {
  const { user } = useAuth();

  const [reviews,    setReviews]    = useState<ReviewResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isWriting,  setIsWriting]  = useState(false);
  const [editTarget, setEditTarget] = useState<ReviewResponse | null>(null);

  // Notify parent whenever reviews change
  useEffect(() => {
    onReviewsChange?.(reviews);
  }, [reviews, onReviewsChange]);

  // Open the write form when triggered externally (e.g. "Write a Review" in header)
  useEffect(() => {
    if (autoOpenForm && user && !myReview) {
      setIsWriting(true);
      onFormOpened?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenForm]);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reviewsApi.getReviews(bookId);
      setReviews(Array.isArray(data.content) ? data.content : []);
    } catch {
      // Non-critical — just show empty state
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const myReview     = user ? reviews.find(r => r.userId === user.id) ?? null : null;
  const otherReviews = user ? reviews.filter(r => r.userId !== user.id) : reviews;

  const handleCreate = async (body: ReviewRequest) => {
    const created = await reviewsApi.createReview(bookId, body);
    setReviews(prev => [created, ...prev]);
    setIsWriting(false);
  };

  const handleUpdate = async (body: ReviewRequest) => {
    if (!editTarget) return;
    const updated = await reviewsApi.updateReview(bookId, editTarget.id, body);
    setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditTarget(null);
  };

  const handleDelete = async (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    try {
      await reviewsApi.deleteReview(bookId, reviewId);
    } catch {
      fetchReviews();
    }
  };

  return (
    <section>
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#d6a84f]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Reviews
        </h2>
        {user && !myReview && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="rounded-lg border border-zinc-700 bg-[#0c0602] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Write form */}
      {isWriting && (
        <div className="mb-6">
          <ReviewForm onSubmit={handleCreate} onCancel={() => setIsWriting(false)} />
        </div>
      )}

      {/* Edit form */}
      {editTarget && (
        <div className="mb-6">
          <ReviewForm initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} />
        </div>
      )}

      {/* Own review first */}
      {myReview && !editTarget && (
        <div className="mb-4">
          <ReviewCard
            review={myReview}
            isOwn
            currentUserDisplayName={user?.displayName}
            onEdit={() => setEditTarget(myReview)}
            onDelete={() => handleDelete(myReview.id)}
          />
        </div>
      )}

      {/* Community reviews */}
      {isLoading && <p className="text-sm text-zinc-600">Loading reviews…</p>}

      {!isLoading && reviews.length === 0 && !isWriting && (
        <p className="text-sm text-zinc-600">
          No reviews yet.{user ? ' Be the first!' : ' Sign in to write one.'}
        </p>
      )}

      {!isLoading && otherReviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {otherReviews.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              isOwn={false}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}
    </section>
  );
}
