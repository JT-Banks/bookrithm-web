'use client';

import { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/lib/hooks/useAuth';
import type { ReviewResponse, ReviewRequest } from '@/types/api';

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

// ─────────────────────────────────────────────────────────────────────────────
// ScoreBar — displays a single rated dimension in read mode.
// Shows the label, a filled bar, and the numeric value.
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-sm w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-300 rounded-full"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-zinc-300 text-sm w-8 text-right shrink-0">{value}/10</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewCard — displays a single submitted review in read mode.
// Shows all non-null scores and the review text.
// If it belongs to the current user, shows Edit and Delete buttons.
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({ review, isOwn, onEdit, onDelete }: {
  review: ReviewResponse;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    onDelete();
  };

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(review.createdAt));

  // Collect only the dimensions that have a non-null score
  const scores = DIMENSIONS.filter(d => review[d.key as keyof ReviewResponse] != null);

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-4 ${
      isOwn ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-900'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">
            {isOwn ? 'Your review' : review.isAnonymous ? 'Anonymous' : 'Community review'}
          </span>
          {review.isAnonymous && !isOwn && (
            <span className="text-xs text-zinc-600 italic">identity hidden</span>
          )}
          {review.isAnonymous && isOwn && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">anonymous</span>
          )}
        </div>
        <span className="text-xs text-zinc-600">{date}</span>
      </div>

      {/* Score bars */}
      {scores.length > 0 && (
        <div className="flex flex-col gap-2">
          {scores.map(d => (
            <ScoreBar
              key={d.key}
              label={d.label}
              value={review[d.key as keyof ReviewResponse] as number}
            />
          ))}
        </div>
      )}

      {/* Review text */}
      {review.reviewText && (
        <p className="text-zinc-300 text-sm leading-relaxed">{review.reviewText}</p>
      )}

      {/* Owner actions */}
      {isOwn && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={onEdit}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
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
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 flex flex-col gap-5">
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
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Review'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewSection — the top-level component dropped into the book detail page.
// Handles fetching, state management, and orchestrating the sub-components.
// Props: bookId — the UUID of the book whose reviews we're showing
// ─────────────────────────────────────────────────────────────────────────────
export function ReviewSection({ bookId }: { bookId: string }) {
  const { user } = useAuth();

  const [reviews,    setReviews]    = useState<ReviewResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isWriting,  setIsWriting]  = useState(false); // show the write form
  const [editTarget, setEditTarget] = useState<ReviewResponse | null>(null); // review being edited

  // Fetch reviews — wrapped in useCallback so we can call it again after mutations
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

  // Find the current user's review (if any) by matching userId
  const myReview = user ? reviews.find(r => r.userId === user.id) ?? null : null;
  const otherReviews = user ? reviews.filter(r => r.userId !== user.id) : reviews;

  // ── Handlers ────────────────────────────────────────────────────────────────
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
    // Optimistic removal
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    try {
      await reviewsApi.deleteReview(bookId, reviewId);
    } catch {
      // Restore on failure
      fetchReviews();
    }
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Reviews</h2>

        {/* Show "Write a Review" only if logged in and user hasn't reviewed yet */}
        {user && !myReview && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="text-sm px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Write form */}
      {isWriting && (
        <div className="mb-6">
          <ReviewForm
            onSubmit={handleCreate}
            onCancel={() => setIsWriting(false)}
          />
        </div>
      )}

      {/* Edit form — replaces the card inline */}
      {editTarget && (
        <div className="mb-6">
          <ReviewForm
            initial={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
          />
        </div>
      )}

      {/* Current user's review — shown first, above community reviews */}
      {myReview && !editTarget && (
        <div className="mb-4">
          <ReviewCard
            review={myReview}
            isOwn
            onEdit={() => setEditTarget(myReview)}
            onDelete={() => handleDelete(myReview.id)}
          />
        </div>
      )}

      {/* Community reviews */}
      {isLoading && <p className="text-zinc-500 text-sm">Loading reviews...</p>}

      {!isLoading && reviews.length === 0 && !isWriting && (
        <p className="text-zinc-600 text-sm">
          No reviews yet.{user ? ' Be the first!' : ' Sign in to write one.'}
        </p>
      )}

      {!isLoading && otherReviews.length > 0 && (
        <div className="flex flex-col gap-4">
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
