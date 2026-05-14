'use client';

import { useState } from 'react';
import { suggestionsApi } from '@/lib/api/suggestions';
import type { SuggestionType } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// bookId is optional — when passed from a book detail page, the suggestion
// is automatically linked to that book. Without it, the form submits a
// general suggestion.
// ─────────────────────────────────────────────────────────────────────────────
interface SuggestionFormProps {
  bookId?: string;
}

// The three types a user can suggest — maps directly to the backend enum.
const SUGGESTION_TYPES: { value: SuggestionType; label: string; description: string }[] = [
  {
    value: 'CATEGORY',
    label: 'Category',
    description: 'A broad genre or style (e.g. "Dark Academia", "Romantasy")',
  },
  {
    value: 'TROPE',
    label: 'Trope',
    description: 'A recurring narrative device (e.g. "Enemies to Lovers", "Chosen One")',
  },
  {
    value: 'CONTENT_WARNING',
    label: 'Content Warning',
    description: 'Sensitive content readers should know about (e.g. "Graphic Violence")',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SuggestionForm — lets a logged-in user suggest a Category, Trope, or
// Content Warning. Submissions are queued for AI vetting → admin review.
//
// Think of this like a feedback form that POSTs to /suggestions.
// ─────────────────────────────────────────────────────────────────────────────
export function SuggestionForm({ bookId }: SuggestionFormProps) {
  // ── Form field state ───────────────────────────────────────────────────────
  const [type,        setType]        = useState<SuggestionType>('CATEGORY');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a name for your suggestion.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Build the payload — the backend uses payload.name for dedup checking.
      // description is optional so we only include it when non-empty.
      const payload: Record<string, string> = { name: trimmedName };
      if (description.trim()) payload.description = description.trim();

      await suggestionsApi.submitSuggestion({
        type,
        bookId: bookId ?? null,
        payload,
      });

      setSuccessMsg('Your suggestion is pending AI review. Thank you!');
      // Reset the form after a successful submission
      setName('');
      setDescription('');
    } catch (err: unknown) {
      // Show the API error message if available, otherwise a generic fallback
      const message =
        err instanceof Error ? err.message : 'Could not submit your suggestion. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Type selector ── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-300">Suggestion type</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {SUGGESTION_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors
                ${type === option.value
                  ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="mt-0.5 block text-xs opacity-70">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Name field ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-name" className="text-sm font-medium text-zinc-300">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="suggestion-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. "${SUGGESTION_TYPES.find(t => t.value === type)?.label === 'Category' ? 'Dark Academia' : type === 'TROPE' ? 'Enemies to Lovers' : 'Graphic Violence'}"`}
          maxLength={100}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* ── Description field (optional) ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-desc" className="text-sm font-medium text-zinc-300">
          Description <span className="text-zinc-500 text-xs font-normal">(optional)</span>
        </label>
        <textarea
          id="suggestion-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly explain what this means or why it should be added..."
          rows={3}
          maxLength={500}
          className="resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* ── Feedback messages ── */}
      {successMsg && (
        <p className="rounded-lg bg-green-900/40 px-4 py-3 text-sm text-green-300">
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </p>
      )}

      {/* ── Submit button ── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-800 text-white px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
        <p className="text-xs text-zinc-500">
          Suggestions are reviewed by AI and then our moderators.
        </p>
      </div>

    </form>
  );
}
