'use client';

import { useState, useEffect, useRef } from 'react';
import { suggestionsApi } from '@/lib/api/suggestions';
import { categoriesApi } from '@/lib/api/categories';
import type { SuggestionType, CategoryResponse } from '@/types/api';

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
// For the CATEGORY type we fetch the existing taxonomy from GET /categories
// and show a live combo-box. This prevents accidental duplicates like
// "darkfantasy", "dark fantasy", "Dark-Fantasy" all being submitted as
// separate suggestions for the same concept.
// ─────────────────────────────────────────────────────────────────────────────
export function SuggestionForm({ bookId }: SuggestionFormProps) {
  // ── Form field state ───────────────────────────────────────────────────────
  const [type,        setType]        = useState<SuggestionType>('CATEGORY');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');

  // ── Category autocomplete state ────────────────────────────────────────────
  // allCategories is loaded once and cached for the lifetime of this form.
  // Think of it like a local in-memory List<Category> loaded at startup.
  const [allCategories,     setAllCategories]     = useState<CategoryResponse[]>([]);
  const [categoriesLoaded,  setCategoriesLoaded]  = useState(false);
  const [showDropdown,      setShowDropdown]       = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  // ── Load the category taxonomy when the user switches to CATEGORY type ─────
  // We only fetch once — after that the list is already in allCategories.
  // Graceful degradation: if the fetch fails we just fall back to plain text.
  useEffect(() => {
    if (type !== 'CATEGORY' || categoriesLoaded) return;

    categoriesApi.listCategories()
      .then((page) => setAllCategories(page.content))
      .catch(() => {}) // fail silently — form still works without autocomplete
      .finally(() => setCategoriesLoaded(true));
  }, [type, categoriesLoaded]);

  // ── Close the dropdown when the user clicks outside the combo-box ──────────
  // This is the standard "click-outside" pattern — attach a listener to the
  // document and check whether the click target is inside our wrapper ref.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Derived: matching categories for the current input ────────────────────
  // Filtered live as the user types. Like a Java Stream.filter() on the list.
  // Capped at 8 results so the dropdown doesn't overflow.
  const filteredCategories =
    type === 'CATEGORY' && name.trim()
      ? allCategories
          .filter((c) => c.name.toLowerCase().includes(name.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  // ── Derived: does the typed name exactly match an existing category? ───────
  // Used to show "existing" vs "new" feedback below the input.
  const exactMatch =
    type === 'CATEGORY' &&
    name.trim() !== '' &&
    allCategories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());

  // ── Handle type toggle ─────────────────────────────────────────────────────
  const handleTypeChange = (next: SuggestionType) => {
    setType(next);
    setShowDropdown(false);
    setName('');       // clear the name so the placeholder updates correctly
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a name for your suggestion.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload: Record<string, string> = { name: trimmedName };
      if (description.trim()) payload.description = description.trim();

      await suggestionsApi.submitSuggestion({
        type,
        bookId: bookId ?? null,
        payload,
      });

      setSuccessMsg('Your suggestion is pending AI review. Thank you!');
      setName('');
      setDescription('');
    } catch (err: unknown) {
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
              onClick={() => handleTypeChange(option.value)}
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
      {/* For CATEGORY: combo-box with autocomplete against existing taxonomy */}
      {/* For TROPE / CONTENT_WARNING: plain text input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-name" className="text-sm font-medium text-zinc-300">
          Name <span className="text-red-400">*</span>
        </label>

        {type === 'CATEGORY' ? (
          // ── Combo-box ───────────────────────────────────────────────────────
          // The wrapper div is what we track for "click outside" detection.
          <div ref={comboboxRef} className="relative">
            <input
              id="suggestion-name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowDropdown(true); // open dropdown as they type
              }}
              onFocus={() => { if (name.trim()) setShowDropdown(true); }}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowDropdown(false); }}
              placeholder='e.g. "Dark Fantasy", "Cosy Mystery"'
              maxLength={100}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />

            {/* Dropdown — only shown when there are matches */}
            {showDropdown && filteredCategories.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                {filteredCategories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // mousedown fires before the input's blur, so prevent
                        // the input from losing focus before we set the value
                        e.preventDefault();
                        setName(cat.name);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // ── Plain text input for Trope / Content Warning ────────────────────
          <input
            id="suggestion-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'TROPE' ? 'e.g. "Enemies to Lovers"' : 'e.g. "Graphic Violence"'}
            maxLength={100}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        )}

        {/* ── Existing vs new category indicator ── */}
        {/* This is the key duplicate-prevention UX: users immediately see */}
        {/* whether their input matches something already in the taxonomy.  */}
        {type === 'CATEGORY' && name.trim() && (
          exactMatch ? (
            <p className="text-xs text-green-400">
              ✓ Existing category — you&apos;re suggesting this book be tagged with it
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              + New category — you&apos;re proposing this be added to the taxonomy
            </p>
          )
        )}
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
          placeholder="Briefly explain what this means or why it applies to this book..."
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
